// ===============================================================================
// config

const defaultSnapOrigin = 'local:http://localhost:8080'; // strictly for demoing stuff for now

// ===============================================================================
// jquery
const $$ =
  /**
   * @param {Element|Document} dom
   */


    (dom = document) =>
    /**
     * @param {string} selector
     * @param {*} [action]
     * @returns {HTMLElement[]}
     */
    (selector, action) => {
      const d = Array.from(dom.querySelectorAll(selector));
      // @ts-ignore
      return action ? d.map(action) : d;
    };

$$.el = (type, options) => {
  const el = document.createElement(type);
  if (options) {
    Object.assign(el, options);
  }
  return el;
};
$$.listeners = new WeakMap();
$$.on = (el, event, listener) => {
  if (!$$.listeners.has(el)) {
    $$.listeners.set(el, []);
  }
  $$.listeners.get(el).push({ event, listener });
  el.addEventListener(event, listener);
};
$$.off = (el) => {
  if (!$$.listeners.has(el)) {
    return;
  }
  $$.listeners.get(el).map((l) => {
    el.removeEventListener(l.event, l.listener);
  });
};
$$.css = (el, css) => {
  Object.entries(css).map(([key, value]) => {
    el.style[key] = value;
  });
};
const $ = $$();

// ===============================================================================

// snaps lib

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
const getSnaps = async () => {
  return await window.ethereum.request({
    method: 'wallet_getSnaps',
  });
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
const connectSnap = async (snapId = defaultSnapOrigin, params = {}) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
const getSnap = async (version) => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/**
 * Invoke the "evaluate" method from the snap-in-a-snap snap.
 */
const evaluate = async (code) => {
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'evaluate',
        params: [code],
      },
    },
  });
};

/**
 * Invoke the "requestPermissions" method from the snap-in-a-snap snap.
 */

const requestPermissions = async () => {
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'requestPermissions' },
    },
  });
};

/**
 * Send any RPC
 */

const sendRpc = async (requestText) => {
  const response = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: JSON.parse(requestText) },
  });
  return response;
};

const isLocalSnap = (snapId) => snapId.startsWith('local:');

// ===============================================================================

// if (!getSnap()) {
// }
Promise.resolve().then(async () => {
  await connectSnap();
  await requestPermissions();

  const snapify = async () => {
    $('.js-code-editor', (editor) => {
      if (editor.snapifySetUp) {
        return;
      }
      const $editor = $$(editor);
      const filename = $editor('.js-gist-filename')[0].value;
      const extension = filename.split('.').pop();

      if (extension === 'js') {
        editor.snapifySetUp = true;

        const runBt = $$.el('button', { textContent: 'Run' });
        $$.on(runBt, 'click', async (e) => {
          e.preventDefault(); //or else the page will reload
          const code = $editor('.js-blob-contents')[0].value;

          console.info(code);
          const res = await evaluate(code);
          alert(res);
        });
        $editor('.gist-filename-input')[0].parentElement.prepend(runBt);
      }

      if (extension === 'json') {
        editor.snapifySetUp = true;

        const testBt = $$.el('button', { textContent: 'Send RPC' });
        $$.on(testBt, 'click', async (e) => {
          e.preventDefault(); //or else the page will reload
          const code = $editor('.js-blob-contents')[0].value;
          console.info(code);

          sendRpc(code).then((response) => {
            alert(response);
          });
        });
        $editor('.gist-filename-input')[0].parentElement.prepend(testBt);
      }
    });
  };
  snapify();

  setInterval(snapify, 2000);
});
