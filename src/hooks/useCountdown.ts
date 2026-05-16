import { useEffect, useState } from "react";

type CountdownResult = {
    display: string;   // e.g. "3d 14h 22m 09s"
    expired: boolean;
};

export function useCountdown(eventDate: string): CountdownResult {
    const [display, setDisplay] = useState("");
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        function tick() {
            const diff = new Date(eventDate).getTime() - Date.now();

            if (diff <= 0) {
                setDisplay("Ended");
                setExpired(true);
                return;
            }

            const d = Math.floor(diff / 86_400_000);
            const h = Math.floor((diff % 86_400_000) / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1_000);

            const parts: string[] = [];
            if (d > 0) parts.push(`${d}d`);
            parts.push(`${String(h).padStart(2, "0")}h`);
            parts.push(`${String(m).padStart(2, "0")}m`);
            parts.push(`${String(s).padStart(2, "0")}s`);

            setDisplay(parts.join(" "));
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [eventDate]);

    return { display, expired };
}
