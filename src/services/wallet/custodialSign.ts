import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { api } from "../apiClient";
import { StepUpPurpose } from "../../hooks/useWalletConnection";

/**
 * Builds a signer matching the same shape as MWA's signAndSendTransaction, so
 * it can be swapped in anywhere a connected-wallet signer is expected. Serializes
 * the (unsigned) transaction, obtains a step-up token via the supplied prompt
 * function, then has the backend sign with the user's custodial key and submit it.
 */
export function makeCustodialSigner(requestStepUp: (purpose: StepUpPurpose) => Promise<string>) {
    return async (tx: Transaction | VersionedTransaction) => {
        const versioned = tx instanceof VersionedTransaction;
        const serialized = Buffer.from(
            versioned
                ? (tx as VersionedTransaction).serialize()
                : (tx as Transaction).serialize({ requireAllSignatures: false, verifySignatures: false }),
        ).toString("base64");

        const stepUpToken = await requestStepUp("wallet-sign");

        return api.post(
            "/api/wallet-sign",
            { transaction: serialized, versioned },
            "Failed to sign transaction",
            { "X-StepUp-Token": stepUpToken },
        );
    };
}
