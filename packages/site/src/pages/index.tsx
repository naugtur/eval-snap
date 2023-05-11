import { useContext, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  sendHello,
  sendRpc,
  requestPermissions,
  evaluate,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  SendHelloButton,
  Card,
} from '../components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const TerminalContainer = styled.div`
  display: flex;
  width: 100%; /* set the width of the parent element */
  flex-direction: column;

  padding: 10px 0;
`;
const CodeBox = styled.textarea`
  min-height: 30rem;
  margin-top: 5px;
  overflow: auto;
  background-color: rgb(51, 51, 51);
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px 0px;
  color: rgb(255, 255, 255);
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  transition: background-color 0.1s linear;

  /* Add this to make the terminal take the full width of its parent */
  flex-grow: 1;
`;
const ResponseBox = styled.pre`
  min-height: 2em;
  overflow: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5em;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const exampleRpc = `{ 
  "method": "hello" 
}`;
const exampleCode = `import { text } from '@metamask/snaps-ui';

export const onRpcRequest = async function ({ origin }) {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation', content: text('hello from ' + origin),
    },
  });
  return 'yay';
};`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [rpcResult, setRpcResult] = useState<string>('');
  const [terminalResult, setTerminalResult] = useState<string>('');

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handlePermissionsRequestClick = async () => {
    try {
      await requestPermissions();
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>Snap in a Snap</Span>
      </Heading>
      <Subtitle>We have to go deeper...</Subtitle>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.isFlask}
                />
              ),
            }}
            disabled={!state.isFlask}
          />
        )}
        {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={handleConnectClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Request Permissions',
            description:
              'Requests the permission to evaluate code within the snap from the snap.',
            button: (
              <SendHelloButton
                onClick={handlePermissionsRequestClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        {/* <Card
          content={{
            title: 'Send hello',
            description: 'Sends a regular message',
            button: (
              <SendHelloButton
                onClick={sendHello}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        /> */}
        {state.installedSnap && (
          <>
            <Subtitle>Write your snap here</Subtitle>
            <TerminalContainer>
              <button
                onClick={(e) => {
                  setTerminalResult('waiting...');
                  evaluate(
                    // I know, I know, but I already have it in localStorage, why duplicate state?
                    window.localStorage.getItem('code') || exampleCode,
                  ).then(
                    (result) => {
                      console.info(result);
                      setTerminalResult(result || '');
                    },
                    (err) => {
                      console.warn(err);
                      setTerminalResult(err.message || '');
                    },
                  );
                }}
              >
                Run
              </button>
              <CodeBox
                onChange={(e) => {
                  const code = e.target.value;
                  window.localStorage.setItem('code', code);
                }}
                defaultValue={
                  window.localStorage.getItem('code') || exampleCode
                }
              ></CodeBox>
              <ResponseBox>{terminalResult}</ResponseBox>
            </TerminalContainer>
            <Subtitle>Send RPC to it</Subtitle>

            <TerminalContainer>
              <button
                onClick={(e) => {
                  setRpcResult('waiting...');
                  sendRpc(
                    window.localStorage.getItem('rpc') || exampleRpc,
                  ).then(
                    (result) => {
                      console.info(result);
                      setRpcResult(result || '');
                    },
                    (err) => {
                      console.warn(err);
                      setRpcResult('Error:\n' + err.message || '');
                    },
                  );
                }}
              >
                Send RPC
              </button>
              <CodeBox
                onChange={(e) => {
                  const rpc = e.target.value;
                  window.localStorage.setItem('rpc', rpc);
                }}
                defaultValue={window.localStorage.getItem('rpc') || exampleRpc}
              ></CodeBox>
              <ResponseBox>{rpcResult}</ResponseBox>
            </TerminalContainer>
            <Notice>
              <p>
                If you're getting a Method not found error, the snap must have
                been terminated. Run your code again.
              </p>
            </Notice>
          </>
        )}
      </CardContainer>
    </Container>
  );
};

export default Index;
