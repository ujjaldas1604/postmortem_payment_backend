import { Request } from 'express';
export interface IRequestWithUserCreds extends Request {
    apiUser?: {
        id: string;
        name: string;
    };
}

export interface IRequestWithAdminCreds extends Request {
    admin?: {
        id: string;
        name: string;
    };
}
