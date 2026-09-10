import { useCallback, useRef, useState } from "react";
import { reauth, StepUpPurpose } from "./useWalletConnection";

/**
 * Imperative password re-auth: call requestStepUp(purpose) to show a modal and
 * await a stepUpToken. Render <PasswordPromptModal {...promptProps} /> once
 * anywhere in the calling screen's tree.
 */
export function useStepUp() {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const purposeRef = useRef<StepUpPurpose | null>(null);
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef  = useRef<((err: Error) => void) | null>(null);

    const requestStepUp = useCallback((purpose: StepUpPurpose): Promise<string> => {
        purposeRef.current = purpose;
        setError(null);
        setVisible(true);
        return new Promise<string>((resolve, reject) => {
            resolveRef.current = resolve;
            rejectRef.current = reject;
        });
    }, []);

    const submit = useCallback(async (password: string) => {
        if (!purposeRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const { stepUpToken } = await reauth(password, purposeRef.current);
            setVisible(false);
            resolveRef.current?.(stepUpToken);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Incorrect password");
        } finally {
            setLoading(false);
        }
    }, []);

    const cancel = useCallback(() => {
        setVisible(false);
        rejectRef.current?.(new Error("Cancelled"));
    }, []);

    return {
        requestStepUp,
        promptProps: { visible, loading, error, onSubmit: submit, onCancel: cancel },
    };
}
