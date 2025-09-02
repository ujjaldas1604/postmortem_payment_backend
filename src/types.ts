export interface AuthTokenResponse {
    token: string;
    status: string;
    remark: string;
    errorCode?: string;
  }
  
  export interface PaymentResponse {
    PaymentReferenceNo: string;
    CMPReferenceNo: string;
    Status: string;
    Remarks: string;
    JournalNo: string;
    ErrorCode: string;
    ProcessedDate: string;
  }
  
  export interface EnquiryResponse {
    paymentStatus: string;
    remarks: string;
  }
  
  export interface PaymentDetails {
    CustomerId: string;
    PaymentReferenceNo: string;
    DebitAccountNo: string;
    BeneficiaryName: string;
    BeneficiaryAccountNo: string;
    BeneficiaryIFSC: string;
    Amount: number;
    MobileNo: string;
    EmailID: string;
    Remarks: string;
    Narration: string;
    AdditionalField?: string;
    ProductCode?: string;
  }
  
  export interface RewardRequest {
    rewardedBy: {
      wbpid: string;
      Name: string;
      Designation: string;
    };
    rewardedTo: {
      wbpid: string;
      Name: string;
      Designation: string;
      UPI: string;
    };
    Amount: string;
    DistrictID: string;
    InformationID: string;
    Token?: string;
  }
  
  export interface StatusCheckRequest {
    TransactionID: string;
    Status: string;
    InformationID: string;
    Token?: string;
  }

  // types.ts
export interface PaymentResponseDTO {
    success: boolean;
    data: {
      TransactionID: string;
      Status: string;
      InformationID: string;
      remarks?: string;
    };
  }