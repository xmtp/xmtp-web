import "./App.css";
import { useSigner } from "wagmi";
import { useEffect } from "react";
import { useClient } from "@xmtp/react-sdk";
import { ContentRouter } from "./ContentRouter";

const App = () => {
  const { data: signer } = useSigner();
  const { disconnect } = useClient();

  // disconnect XMTP client when the wallet changes
  useEffect(() => {
    disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer]);

  return (
    <div className="App">
      <ContentRouter />
    </div>
  );
};

export default App;
