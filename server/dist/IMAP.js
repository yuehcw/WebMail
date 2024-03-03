"use strict";
// talks to an IMAP server to list mailboxes and messages and to retrieve messages
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const ImapClient = require("emailjs-imap-client");
const mailparser_1 = require("mailparser");
// Disable certificate validation (less secure, but needed for some servers).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// The worker that will perform IMAP operations and interact with main.ts.
class Worker {
    constructor(inServerInfo) {
        Worker.serverInfo = inServerInfo;
    } // the server information is passed in to the constructor and stored.
    /**
     * Connect to the SMTP server and return a emailjs-imap-client object for operations to use.
     *
     * @return An ImapClient instance.
     */
    connectToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new ImapClient.default(Worker.serverInfo.imap.host, Worker.serverInfo.imap.port, { auth: Worker.serverInfo.imap.auth } // pass in a username and password
            );
            client.logLevel = client.LOG_LEVEL_NONE; // keep the output logging
            client.onerror = (inError) => {
                console.log("IMAP.Worker.listMailboxes(): Connection error", inError);
            }; // error handler without re-trying
            yield client.connect();
            return client;
        });
    } /* End connectToServer(). */
    /**
     * Returns a list of all (top-level) mailboxes.
     *
     * @return An array of objects, on per mailbox, that describes the nmilbox.
     */
    listMailboxes() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer(); // get a client
            const mailboxes = yield client.listMailboxes(); // get the list
            yield client.close();
            // Translate from emailjs-imap-client mailbox objects to app-specific objects. 
            // At the same time, flatten the list of mailboxes to a one-dimensional array of objects via iterateChildren function recursion.
            const finalMailboxes = [];
            const iterateChildren = (inArray) => {
                // For each mailbox encountered, added new object that contains jname and path to finalMailboxes
                inArray.forEach((inValue) => {
                    finalMailboxes.push({
                        name: inValue.name,
                        path: inValue.path
                    });
                    iterateChildren(inValue.children); // handle with children property
                });
            };
            iterateChildren(mailboxes.children);
            return finalMailboxes;
        });
    } /* End listMailboxes(). */
    /**
     * Lists basic information about messages in a named mailbox.
     *
     * @param inCallOptions An object implementing the ICallOptions interface.
     * @return              An array of objects, one per message.
     */
    listMessages(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer();
            // We have to select the mailbox first. This gives us the message count.
            // The inCallOptions object contain the name of the mailbox in mailbox field
            const mailbox = yield client.selectMailbox(inCallOptions.mailbox);
            // If there are no messages then just return an empty array.
            if (mailbox.exists === 0) {
                yield client.close();
                return [];
            }
            // Note that they are returned in order by uid, so it's FIFO.
            const messages = yield client.listMessages(inCallOptions.mailbox, // mailbox name
            "1:*", // messages type: messages beginning with the first one and all messages after it. *: any value
            ["uid", "envelope"] // properties, envelope: metadata
            );
            yield client.close();
            // Translate from emailjs-imap-client message objects to app-specific objects.
            const finalMessages = [];
            messages.forEach((inValue) => {
                finalMessages.push({
                    id: inValue.uid,
                    date: inValue.envelope.date,
                    from: inValue.envelope.from[0].address,
                    subject: inValue.envelope.subject // subject
                });
            });
            return finalMessages;
        });
    } /* End listMessages(). */
    /**
     * Gets the plain text body of a single message.
     *
     * @param  inCallOptions An object implementing the ICallOptions interface.
     * @return               The plain text body of the message.
     */
    getMessageBody(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer();
            const messages = yield client.listMessages(inCallOptions.mailbox, inCallOptions.id, // specifying a specific message ID 
            ["body[]"], // body can be in multiple parts, it’s actually an array
            { byUid: true } // listing messages based on a specific ID
            );
            const parsed = yield (0, mailparser_1.simpleParser)(messages[0]["body[]"]); // parses the message into a ParsedMail object
            yield client.close();
            return parsed.text; // return the text property of that object
        });
    } /* End getMessageBody(). */
    /**
     * Deletes a single message.
     *
     * @param inCallOptions An object implementing the ICallOptions interface.
     */
    deleteMessage(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer();
            const messages = yield client.listMessages(inCallOptions.mailbox, inCallOptions.id, // specifying a specific message ID 
            ["uid"], // body can be in multiple parts, it’s actually an array
            { byUid: true } // listing messages based on a specific ID
            );
            if (inCallOptions.mailbox !== 'Deleted') {
                yield client.copyMessages(inCallOptions.mailbox, messages[0]['uid'], 'Deleted', { byUid: true } // tell the method that we are passing a unique ID
                );
            }
            yield client.deleteMessages(inCallOptions.mailbox, messages[0]['uid'], 
            // inCallOptions.id,
            { byUid: true } // tell the method that we are passing a unique ID
            );
            yield client.close(); // no return
        });
    } /* End deleteMessage(). */
    markAsRead(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer();
            yield client.setFlags(inCallOptions.mailbox, inCallOptions.id, ['\Seen']);
            yield client.close();
        });
    }
} /* End class. */
exports.Worker = Worker;
//# sourceMappingURL=IMAP.js.map