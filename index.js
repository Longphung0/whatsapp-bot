const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express().use(body_parser.json());
const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

app.listen(process.env.PORT, () => {
    console.log("Webhook is listening.")
});
//to verify the callback url from dashboard side - cloud api side
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"]; 

    if(mode && token){
        if(mode==="subscribe" && token === mytoken){
            res.status(200).send(challenge);
        }else{
            res.sendStatus(403);
        }
    }
});

app.post("/webhook", (req, res) => {
    let body_param = req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        console.log("Inside Body Param");
        if(body_param.entry &&
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]
        ){
            let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            
            // Check if it's a text message or an interactive response
            const message = body_param.entry[0].changes[0].value.messages[0];
            
            if (message.type === 'text') {
                let msg_body = message.text.body;
                console.log("phone number: " + phon_no_id);
                console.log("from: " + from);
                console.log("body param: " + msg_body);
                
                // Send interactive list message
                axios({
                    method: "POST",
                    url: "https://graph.facebook.com/v17.0/" + phon_no_id + "/messages?access_token=" + token,
                    data: {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "interactive",
                        interactive: {
                            type: "list",
                            body: {
                                text: "Hello, I'm your virtual PSA Haulier Services Assistant!\nPlease select one of the options below:"
                            },
                            footer: {
                                text: "Powered by Long PSA"
                            },
                            action: {
                                button: "Select",
                                sections: [
                                    {
                                        title: "Container Requests",
                                        rows: [
                                            {
                                                id: "change_weight",
                                                title: "Weight",
                                                description: "Amend the Container's Weight"
                                            },
                                            {
                                                id: "change_sealNumber",
                                                title: "Seal Number",
                                                description: "Amend a Seal Number"
                                            },
                                            {
                                                id: "change_containerNumber",
                                                title: "Container Number",
                                                description: "Amend a Container's Number"
                                            },
                                            {
                                                id: "esn_deletion",
                                                title: "ESN Deletion",
                                                description: "Delete an ESN"
                                            },
                                            {
                                                id: "early_acceptance",
                                                title: "Early Acceptance GP",
                                                description: "Request for an Early Acceptance"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
            } else if (message.type === 'interactive') {
                // Handle interactive responses
                const interactiveResponse = message.interactive;
                let selectedId = "";
                
                if (interactiveResponse.type === 'list_reply') {
                    selectedId = interactiveResponse.list_reply.id;
                    
                    let formURL = "";

                    switch(selectedId) {
                        case "change_weight":
                            formURL = "https://forms.office.com/r/4nHZRifaWj";
                            break;
                        case "change_sealNumber":
                            formURL = "https://forms.office.com/r/xr1ry06Vm3";
                            break;
                        case "change_containerNumber":
                            formURL = "https://forms.office.com/r/dD45UytWVZ";
                            break;
                        case "esn_deletion":
                            formURL = "https://forms.office.com/r/u2i5myxs1L";
                            break;
                        case "early_acceptance":
                            formURL = "https://forms.office.com/r/QXxxmqWXw7";
                            break;
                        default:
                            formURL = null;
                    }
                    const selectedTitle = interactiveResponse.list_reply.title;
                    let responseMessage = "";

                    if (formURL) {
                        responseMessage = `You've selected the *${selectedTitle}* request.\n\nPlease fill in the form here:\n${formURL}`;
                    } else {
                        responseMessage = "Option not recognized. Please try again.";
                    }

                    
                    // Send text response based on selection
                    axios({
                        method: "POST",
                        url: "https://graph.facebook.com/v17.0/" + phon_no_id + "/messages?access_token=" + token,
                        data: {
                            messaging_product: "whatsapp",
                            to: from,
                            text: {
                                body: responseMessage
                            }
                        },
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });
                }
            }
            
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Webhook Hello hihi");
});