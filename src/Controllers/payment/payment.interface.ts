export interface IDecryptedPaymentResponse {
    PaymentReferenceNo: string;
    CMPReferenceNo: string;
    Status: "Success" | "Pending" | "Failure";
    Remarks: string;
    JournalNo: string;
    errorCode: string;
    processedDate: string; // Format: "dd-mm-yyyy"
}