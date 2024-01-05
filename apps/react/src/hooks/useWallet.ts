import { useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";

export const useWallet = () => useContext(WalletContext);
