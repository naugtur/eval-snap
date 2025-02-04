import { OnRpcRequestHandler } from '@metamask/snaps-types';
import * as snapsUi from '@metamask/snaps-ui';
import { StaticModuleRecord } from '@endo/static-module-record';
import { addToCompartment, getRemoteModuleRecord } from './sesities';

const { panel, text } = snapsUi;

const defaultEndowments = Object.assign({}, globalThis, { eval: undefined });

let subSnapExports: any = {};


/**
 * Persists the snap state.
 *
 * @param newState - The new state to persist.
 */
async function updateState(newState: Record<string, unknown>) {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState },
  });
}

/**
 * Retrieves the snap state
 * @returns The snap state
 */
async function getState() {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
}

/**
 * Retrieves the permitted domains
 * 
 * @returns The permitted domains
 */
async function getPermittedDomains(): Promise<string[]> {
  const state = await getState();
  if (
    state &&
    'permittedDomains' in state &&
    Array.isArray(state.permittedDomains)
  ) {
    return state.permittedDomains;
  }

  return [];
}

/**
 * Adds a domain to the permitted domains.
 *
 * @param domain - The domain to add to the permitted domains.
 */
async function setPermittedDomain(domain: string) {
  const permittedDomains = await getPermittedDomains();
  permittedDomains.push(domain);
  await updateState({ permittedDomains });
}

/**
 * Checks if a given domain is permitted.
 *
 * @param domain - The domain to check.
 * @returns Whether the domain is permitted.
 */
async function checkPermittedDomain(domain: string) {
  const permittedDomains = await getPermittedDomains();
  return permittedDomains.includes(domain);
}

let approvalSequence: Promise<any> = Promise.resolve(true);

/**
 * Ask to load a module without causing: Request of type 'snap_dialog:confirmation' already pending for origin.
 *
 * @param specifier - name to display.
 * @returns The export namespace of the evaluated code.
 */
async function askToLoad(specifier: string) {
  const next = approvalSequence.then(() =>
    snap
      .request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: text(
            `Knock knock! Who's there? It's ${specifier
              .replace(/^\/npm\//, '')
              .replace(/\/\+esm$/, '')}. Can I come in?`,
          ),
        },
      })
      .then((approved) => {
        if (!approved) {
          throw Error('User denied');
        }
      }),
  );
  approvalSequence = next;
  return next;
}


/**
 * Evaluates the given code in a compartment.
 *
 * @param code - The code to evaluate.
 * @returns The export namespace of the evaluated code.
 */
async function evaluate(code: string): Promise<object> {
  const compartment = new Compartment(
    defaultEndowments,
    {
      '@metamask/snaps-ui': await addToCompartment(
        '@metamask/snaps-ui',
        snapsUi,
      ),
    },
    {
      __evadeHtmlCommentTest__: true,
      importHook: async (specifier: string) => {
        if (specifier === '*/#/*') {
          return new StaticModuleRecord(code, '.');
        }

        await askToLoad(specifier);
        return getRemoteModuleRecord(specifier);
      },
      resolveHook: (a) => a,
    },
  );
  const { namespace } = await compartment.import('*/#/*'); // does this look like an angry Koala bear to you too?
  return namespace;
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  let approved;
  const { params } = request;
  const warning = panel([
    text(
      `The domain at ** ${origin}** would like unmitigated access to your wallet.`,
    ),
    text(
      `You should only grant this if it's a site you trust with your entire wallet. Probably only do this if you're a developer and have read the source code of the site you're connecting to.`,
    ),
    text(
      `Oh, or if you're using a test wallet! Use a test wallet for development. That's a great idea anyways.`,
    ),
  ]);
  const code = params && Array.isArray(params) && params[0];
  switch (request.method) {
    case 'requestPermissions':
      approved = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: warning,
        },
      });

      if (approved) {
        await setPermittedDomain(origin);
        return true;
      }
      return false;
    case 'evaluate':
      approved = await checkPermittedDomain(origin);
      if (!approved) {
        throw new Error('Origin not permitted to evaluate code.');
      }

      if (!('params' in request) || !code || typeof code !== 'string') {
        throw new Error('Evaluate method requires a string to evaluate.');
      }

      subSnapExports = await evaluate(code);
      return `ok. exports: ${Object.keys(subSnapExports).join()}`;
    default:
      // TODO: do the same for onTransaction.
      if (subSnapExports.onRpcRequest) {
        return await subSnapExports.onRpcRequest({ origin, request });
      }
      throw new Error('Method not found.');
  }
};
