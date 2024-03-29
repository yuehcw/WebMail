// This contains a Worker for
// performing all the IMAP functions, in conjunction with the server.

import axios, { AxiosResponse } from "axios";

import { config } from "./config";

export interface IMailbox { name: string, path: string }

export interface IMessage {
  id: string,
  date: string,
  from: string,
  subject: string,
  body?: string
}


export class Worker {

  public async listMailboxes(): Promise<IMailbox[]> {
    const response: AxiosResponse = await axios.get(`${config.serverAddress}/mailboxes`);
    return response.data;
  }

  public async listMessages(inMailbox: string): Promise<IMessage[]> {
    const response: AxiosResponse = await axios.get(`${config.serverAddress}/mailboxes/${inMailbox}`);
    return response.data;
  }


  public async getMessageBody(inID: string, inMailbox: String): Promise<string> {
    const response: AxiosResponse = await axios.get(`${config.serverAddress}/messages/${inMailbox}/${inID}`);
    return response.data;
  }

  public async deleteMessage(inID: string, inMailbox: String): Promise<void> {
    await axios.delete(`${config.serverAddress}/messages/${inMailbox}/${inID}`);
  }


}
