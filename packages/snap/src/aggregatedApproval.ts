// debouncing crashes the snap, so this code is left for later.

type ApprovalInventory = {
  timer: any;
  list: { specifier: string; specifierDisplayName: string }[];
  promise: Promise<any>;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
};

/**
 * Creates a new inventory.
 *
 * @returns The new inventory
 */
function newInventory(): ApprovalInventory {
  const inventory: ApprovalInventory = {
    timer: null,
    list: [],
    promise: Promise.resolve('typescript made me do it'),
    resolve(): void {
      throw new Error('Function not implemented.');
    },
    reject(): void {
      throw new Error('Function not implemented.');
    },
  };
  inventory.promise = new Promise((resolve, reject) => {
    inventory.resolve = resolve;
    inventory.reject = reject;
  });
  return inventory;
}
let approvalInventory: ApprovalInventory = newInventory();

async function approveInventory() {
  const { list, resolve, reject } = approvalInventory;
  approvalInventory = newInventory();
  const approved = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        text(
          `Knock knock! Who's there? It's ${list
            .map(({ specifierDisplayName }) => specifierDisplayName)
            .join(' and ')}. Is this where the party is?`,
        ),
      ]),
    },
  });
  if (approved) {
    resolve();
  } else {
    reject(Error('User denied'));
  }
}

async function askToLoadDebounced(specifier: string) {
  clearTimeout(approvalInventory.timer);
  const specifierDisplayName = `${specifier
    .replace(/^\/npm\//, '')
    .replace(/\/\+esm$/, '')}`;
  approvalInventory.list.push({ specifier, specifierDisplayName });
  setTimeout(approveInventory, 250);
  return approvalInventory.promise;
}
