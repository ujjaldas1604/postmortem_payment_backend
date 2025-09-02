import { config } from "../config/config.js"
import axios from "axios"
import { sbiEncryption } from "./encrypt.utils"
import { sbiDecryption } from "./decrypt.utils"


const baseURL = config.SBI_BASE_URL

const paymentStatus = async (token: any, customerId: string, paymentReferenceNo: string) => {
    try {
        const sessionKey = sbiEncryption.generateSessionKey(16)
        const enquiryPayload = JSON.stringify({
            CustomerId: customerId,
            PaymentReferenceNo: paymentReferenceNo
        })
        const encryptedEnquiryPayload = sbiEncryption.EncryptAES(enquiryPayload, sessionKey)

        const response = await axios.post(`${baseURL}/RealTimeEnquiryServices/Service/Enquiry/`, {
            EnquiryRequest: encryptedEnquiryPayload,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
        const decryptedResponse = JSON.parse(sbiDecryption.DecryptAES(response.data, sessionKey))
        return decryptedResponse
    }
    catch (err: any) {
        return "Could Not get Status due to error in the Payment Status Function";
    }
}

export default paymentStatus