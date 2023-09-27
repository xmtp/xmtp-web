import "./App.css";
import { useEffect } from "react";
import { useClient } from "@xmtp/react-sdk";
import { ContentRouter } from "./ContentRouter";
import { useWallet } from "../hooks/useWallet";

const App = () => {
  const { address } = useWallet();
  const { disconnect } = useClient();

  // disconnect XMTP client when the wallet changes
  useEffect(() => {
    void disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <div className="App">
      <ContentRouter />
    </div>
  );
};

export default App;
