// The main code entry point. This is where React
// will begin to build UI from

// Initializing the React Application
// Setting Up the Application Structure (BaseLayout)


// leading to the rendering of the initial UI and the kickoff of the application's logic.

import "normalize.css";
import "../css/main.css";

import React from "react";
import ReactDOM from "react-dom";

// Importing BaseLayout component to serve as the root component of the app.
import BaseLayout from "./components/BaseLayout";
import * as IMAP from "./IMAP";
import * as Contacts from "./Contacts";


const baseComponent = ReactDOM.render(<BaseLayout />, document.body);


baseComponent.state.showHidePleaseWait(true);

// This function interacts with an IMAP server to fetch email data.
async function getMailboxes() {
  const imapWorker: IMAP.Worker = new IMAP.Worker();
  const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
  mailboxes.forEach((inMailbox) => {
    baseComponent.state.addMailboxToList(inMailbox);
  });
}

getMailboxes().then(function() {
  async function getContacts() {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contacts: Contacts.IContact[] = await contactsWorker.listContacts();
    contacts.forEach((inContact) => {
      baseComponent.state.addContactToList(inContact);
    });
  }
  getContacts().then(() => baseComponent.state.showHidePleaseWait(false));
});
