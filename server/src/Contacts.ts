import * as path from "path";
const Datastore = require("nedb");

export interface IContact {
    _id?: number, name: string, email: string
}

export class Worker {
    private db: Nedb;

    constructor() {
        this.db = new Datastore({
            filename: path.join(__dirname, "contacts.db"),
            autoload: true
        });
    }

    public listContacts(): Promise<IContact[]> {
        return new Promise((inResolve, inReject) => {
            this.db.find({},
                (inError: Error, inDocs: IContact[]) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inDocs);
                    }
                }
            );
        });
    }

    public addContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            // insert method passes the added object to the callback, which include an _id field
            this.db.insert(
                inContact, // the contact to add
                (inError: Error | null, inNewDoc: IContact) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inNewDoc);
                    }
                }
            );
        });
    }

    public updateContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            this.db.update(
                {_id : inContact._id},
                inContact,
                {returnUpdatedDocs: true},
                (inError: Error | null, numberOfUpdated: number, inDocs: IContact, upsert: boolean) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inDocs);
                    }
                }
            );
        });
    }

    public deleteContact(inID: string): Promise<string | void> {
        return new Promise((inResolve, inReject) => {
            this.db.remove(
                { _id: inID },
                {},
                (inError: Error | null, inNumRemoved: number) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve();
                    }
                }
            );
        });
    }
}
