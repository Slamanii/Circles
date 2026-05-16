import { buyWithMoonpay } from "./buyProviders/moonpay"
import { buyWithAzza } from "./buyProviders/useAzza"
import { BuyRequest } from "../../../../shared/Types"



export async function buyAsset(req: BuyRequest) {

    switch (req.provider) {

        case "MOONPAY":
            return buyWithMoonpay(req);

        case "AZZA":
            return buyWithAzza(req);

        default: 
            throw new Error("Unsupported provider");
    }
}