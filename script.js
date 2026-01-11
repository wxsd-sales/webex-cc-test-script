const style = document.createElement("style");
const template = document.createElement("template");
style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");


      table{
         border: 0px solid black;
      }

      .mylabel {
         width:281px;
         height:50px;
         display:   inline-block; 
      }

.onoffswitch {
    position: relative; 
    width: 50px;              /* moins large */
    -webkit-user-select:none; 
    -moz-user-select:none; 
    -ms-user-select:none;
}

.onoffswitch-checkbox {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.onoffswitch-label {
    display: block; 
    overflow: hidden; 
    cursor: pointer;
    border-radius: 30px;
    background-color: #ccc;   /* fond par dÃƒÂ©faut */
    height: 28px;
}

/* --- SLIDER INTERNE (sans texte) --- */
.onoffswitch-inner {
    width: 100%;     
    height: 100%;
    background: none;
}

/* Suppression des libellÃƒÂ©s Oui / Non */
.onoffswitch-inner:before,
.onoffswitch-inner:after {
    content: "";
    display: none;
}

/* --- BOUTON ROND PLUS GROS --- */
.onoffswitch-switch {
    width: 24px;                  /* rond plus gros */
    height: 24px;
    background: white;
    position: absolute;
    top: 2px;
    left: 2px;                    /* position OFF */
    border-radius: 50%;
    transition: .3s;
}

/* --- Quand c'est CHECKÃƒâ€° --- */
.onoffswitch-checkbox:checked + .onoffswitch-label {
    background-color: #4caf50;    /* couleur demandÃƒÂ©e */
}

.onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-switch {
    left: 24px;                   /* dÃƒÂ©placement du bouton */
}


@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
template.innerHTML = `

      <div class="column" style="padding:10px">
      <p>Hello world </p>
        <div id="table-container"></div>   
      </div>
      <div class="column" style="padding:10px">
         <div id="table-container-string"></div>      
      </div>
      <div class="column" style="padding:10px">
         <div id="table-container-integer"></div>      
      </div>

    <label class="mylabel" id="submitted"></label>`;

class SupervisorControlsCAA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.timeoutID = undefined;
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.appendChild(style);

    var agentEditable = [];
    var variableType = [];
    var agentViewable = [];
    var reportable = [];
    var active = [];
    var defaultValue = [];
    var gvid = [];
    var gvname = [];
    var checkboxname = [];
    var submitname = [];
    var textareaname = [];
    var remainingname = [];
    var description = [];
    var savedtext = [];

    var org = this.orgId;

    var context = this.shadowRoot;
    var username = this.User;
    var passphrase = this.passPhrase;
    var access_token;
    var triggerurl =
      "https://europe-west2-token-service-413010.cloudfunctions.net/token-service";
    var tokenname = "wxcctoken";
    GetAccessToken();

    function GetAccessToken() {
      const myHeaders = new Headers();
      myHeaders.append("x-token-passphrase", passphrase);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      console.log(requestOptions);

      fetch(triggerurl + "?name=" + tokenname, requestOptions)
        .then((response) => response.text())
        .then((result) => GetGlobalVariables(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function GetGlobalVariables(result) {
      var searchstring;
      access_token = result.token;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + access_token);

      const raw = JSON.stringify({
        query: `
{
  task(
    from: "1767874520000"
    to: "1767961693000"
    filter:{ 
      and: [
        { channelType: { equals: email } }
        { stringGlobalVariables: {
          name: { equals: "RefSinistre"}
          value: { equals: "S0133"}
        }}
      ]
    }
  ) {
    tasks {
      id 
      status
      createdTime
      customer{
        name
      }
      channelMetaData{
        email{
          subject
        }
      }
      stringGlobalVariables(name: "RefSinistre") {
        name
        value
      }
      TacheFille: stringGlobalVariables(name: "TacheFille") {
        name
        value
      }
      DateReactivation: stringGlobalVariables(name: "DateReactivationTache") {
        name
        value
      }
    }
  }
}
`,
        variables: {},
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(
        "https://api.wxcc-eu1.cisco.com/search?orgId=" + org,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => console.log("rkanthet: result", JSON.parse(result)))
        .catch((error) => console.log("[TASKVIEWER] - ERROR - ", error));
    }

    function GotVariables(result, context) {
      //rkanthet: single array update
      var alldata = [];

      for (let i = 0; i < result.meta.totalRecords; i++) {
        agentEditable[i] = result.data[i].agentEditable;
        variableType[i] = result.data[i].variableType;
        agentViewable[i] = result.data[i].agentViewable;
        reportable[i] = result.data[i].reportable;
        active[i] = result.data[i].active;
        defaultValue[i] = result.data[i].defaultValue;
        gvid[i] = result.data[i].id;
        gvname[i] = result.data[i].name;
        savedtext[i] = result.data[i].defaultValue;
        checkboxname[i] = "checkbox" + i;
        submitname[i] = "submit" + i;
        textareaname[i] = "textarea" + i;
        remainingname[i] = "remaining" + i;
        description[i] = result.data[i].description;

        if (
          description[i] == "" ||
          description[i] === undefined ||
          description[i] == null
        ) {
          description[i] = gvname[i];
        }

        //rkanthet: push to single array
        if (result.data[i].variableType == "Boolean") {
          alldata.push({
            type: "Boolean",
            name: description[i],
            Value: defaultValue[i],
            CheckName: checkboxname[i],
            SubmitName: submitname[i],
            originalIndex: i,
          });
        }
        if (result.data[i].variableType == "String") {
          alldata.push({
            type: "String",
            name: description[i],
            Value: defaultValue[i],
            TextAreaName: textareaname[i],
            SubmitName: submitname[i],
            RemainingName: remainingname[i],
            originalIndex: i,
          });
        }
        // ADDED: Condition for Integer type
        if (result.data[i].variableType == "Integer") {
          alldata.push({
            type: "Integer",
            name: description[i],
            Value: defaultValue[i],
            InputName: "input" + i,
            SubmitName: submitname[i],
            originalIndex: i,
          });
        }
      }

      // rkanthet:Define the desired order
      const desiredOrder = [
        "Activation message exceptionnel",
        "Message exceptionnel",
        "Calendrier de disponibilités",
        "Utilisation de l'IA",
        "% Agent IA vs DTMF",
        "Période de récolte",
        "Choix Compétence 1",
        "Exigence Compétence 1",
        "Choix Compétence 2",
        "Exigence Compétence 2",
        "1er Seuil d'élargissement",
        "Exigence relaxée Compétence 1",
        "SLA File Traitement sinistre",
        "SLA File Protection Juridique",
      ];

      // rkanthet:Sort function to apply to all data types
      const sortByDesiredOrder = (a, b) => {
        const indexA = desiredOrder.indexOf(a.name);
        const indexB = desiredOrder.indexOf(b.name);
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      };
      alldata.sort(sortByDesiredOrder);

      const tableContainer = context.getElementById("table-container");
      tableContainer.innerHTML = generateCombinedTable(alldata);

      const stringtableContainer = context.getElementById(
        "table-container-string"
      );
      stringtableContainer.innerHTML = "";

      const integertableContainer = context.getElementById(
        "table-container-integer"
      );
      integertableContainer.innerHTML = "";

      // Initialise character count
      for (let i = 0; i < result.meta.totalRecords; i++) {
        if (variableType[i] == "String") {
          var spanid = context.getElementById(remainingname[i]);
          var textareaid = context.getElementById(textareaname[i]);
          var textarealength = textareaid.value.length;
          //            spanid.innerHTML=textarealength+"/256";
          spanid.innerHTML = "";
        }
      }
    }

    // rkanthet: generate combined table
    function generateCombinedTable(data) {
      let table = '<table style="width:800px">';
      data.forEach((item) => {
        if (item.type == "Boolean") {
          // Boolean - toggle switch
          if (item.Value == "true") {
            table += `<tr><td width="300">${item.name}</td><td><div class="onoffswitch"><input type=checkbox onclick="checkboxticked(id)" class="onoffswitch-checkbox" tabindex="0" checked id=${item.CheckName} data-index="${item.originalIndex}"><label class="onoffswitch-label" for=${item.CheckName}><span class="onoffswitch-inner"></span><span class="onoffswitch-switch"></span></label></td></div><td><button onclick="submitticked(id)" style="background-color:lightgrey;color:white;padding:6px 18px;font-size:16px;border-radius:7px;border:none;cursor:pointer;" id=${item.SubmitName} data-index="${item.originalIndex}" disabled>Confirmer</button></td><td></td></tr>`;
          } else {
            table += `<tr><td width="300">${item.name}</td><td><div class="onoffswitch"><input type=checkbox onclick="checkboxticked(id)" class="onoffswitch-checkbox" tabindex="0"  id=${item.CheckName} data-index="${item.originalIndex}"><label class="onoffswitch-label" for=${item.CheckName}><span class="onoffswitch-inner"></span><span class="onoffswitch-switch"></span></label></td></div><td><button onclick="submitticked(id)" style="background-color:lightgrey;color:white;padding:6px 18px;font-size:16px;border-radius:7px;border:none;cursor:pointer;" id=${item.SubmitName} data-index="${item.originalIndex}" disabled>Confirmer</button></td><td></td></tr>`;
          }
        } else if (item.type == "String") {
          // String - textarea
          table += `<tr><td width="300">${item.name}</td><td><div><textarea  style="padding: 10px; font-size: 14px; border: 1px solid #ADD8E6; border-radius: 3px; background-color: #f4f4f4; color: #333;" rows="2" cols="50" maxlength="256" id=${item.TextAreaName} data-index="${item.originalIndex}">${item.Value}</textarea><span style="font-size: small" id=${item.RemainingName}></span></div></td><td><button onclick="submitticked(id)" style="background-color:lightgrey;color:white;padding:6px 18px;font-size:16px;border-radius:7px;border:none;cursor:pointer;" id=${item.SubmitName} data-index="${item.originalIndex}" disabled>Confirmer</button></td><td></td></tr>`;
        } else if (item.type == "Integer") {
          // Integer - number input
          table += `<tr><td width="300">${item.name}</td><td><div><input type="number" style="padding: 10px; font-size: 14px; border: 1px solid #ADD8E6; border-radius: 3px; background-color: #f4f4f4; color: #333;" id=${item.InputName} data-index="${item.originalIndex}" value="${item.Value}"></input></div></td><td><button onclick="submitticked(id)" style="background-color:lightgrey;color:white;padding:6px 18px;font-size:16px;border-radius:7px;border:none;cursor:pointer;" id=${item.SubmitName} data-index="${item.originalIndex}" disabled>Confirmer</button></td><td></td></tr>`;
        }
      });
      table += "</table>";
      return table;
    }

    context.addEventListener("paste", (e) => {
      let data = e.clipboardData.getData("text/plain");
      //   text.innerHTML = data;
      //      var textarealength = e.srcElement.value.length+data.length;
      //      e.srcElement.nextSibling.innerHTML=textarealength+"/256";
      e.srcElement.nextSibling.innerHTML = "";
    });

    context.addEventListener("keyup", (e) => {
      // Check if the event source is a textarea or a number input
      if (e.srcElement.nodeName === "TEXTAREA") {
        // Original character count logic (commented out in user's code)
        // var textarealength = e.srcElement.value.length;
        // e.srcElement.nextSibling.innerHTML=textarealength+"/256";
        e.srcElement.nextSibling.innerHTML = "";
        ValueChanged(e.srcElement); // Call the generic value change handler
      } else if (e.srcElement.type === "number") {
        // MODIFIED: Added condition for number input
        ValueChanged(e.srcElement); // Call the generic value change handler
      }
    });

    // rkanthet: Listen for change events on number inputs (for up/down arrow clicks)
    context.addEventListener("change", (e) => {
      if (e.srcElement.type === "number") {
        ValueChanged(e.srcElement);
      }
    });

    // rkanthet: Listen for input events on number inputs (for real-time updates)
    context.addEventListener("input", (e) => {
      if (e.srcElement.type === "number") {
        ValueChanged(e.srcElement);
      }
    });

    context.addEventListener("click", (e) => {
      buttonclicked(e.srcElement);
    });

    function buttonclicked(id) {
      // Get number
      if (id.nodeName == "INPUT" && id.type === "checkbox") {
        checkboxticked(id);
      } else if (id.nodeName == "BUTTON") {
        submitticked(id);
      }
    }

    function checkboxticked(id) {
      // Get number
      var checkboxid = context.getElementById(id.id);

      var index = checkboxid.dataset.index || id.id.replace(/\D/g, "");
      var submitboxid = context.getElementById("submit" + index);
      submitboxid.style.backgroundColor = "#00a0d1";
      submitboxid.disabled = false;

      if (checkboxid.checked == true) {
        defaultValue[index] = "true";
      } else {
        defaultValue[index] = "false";
      }

      if (defaultValue[index] == savedtext[index]) {
        submitboxid.style.backgroundColor = "lightgrey";
        submitboxid.disabled = true;
      } else {
        submitboxid.style.backgroundColor = "#00a0d1";
        submitboxid.disabled = false;
      }
    }

    // Renamed from StringChanged to ValueChanged for generic handling
    function ValueChanged(id) {
      var index = id.dataset.index || id.id.replace(/\D/g, "");
      var submitboxid = context.getElementById("submit" + index);

      // Compare current value with saved value.
      // For numbers, id.value will be a string, and savedtext[index] is also a string.
      // Strict equality comparison `===` is appropriate here.
      if (id.value === savedtext[index]) {
        submitboxid.style.backgroundColor = "lightgrey";
        submitboxid.disabled = true;
      } else {
        submitboxid.style.backgroundColor = "#00a0d1";
        submitboxid.disabled = false;
      }

      defaultValue[index] = id.value;
    }

    function submitticked(id) {
      var submitboxid = context.getElementById(id.id);
      submitboxid.style.backgroundColor = "lightgrey";
      submitboxid.disabled = true;

      var index = submitboxid.dataset.index || id.id.replace(/\D/g, "");
      savedtext[index] = defaultValue[index];

      // --- ADDED/MODIFIED LINES START HERE ---
      let valueToSubmit = defaultValue[index]; // Start with the current value
      if (variableType[index] === "Integer") {
        // Convert to an integer. parseInt will convert the string "123" to the number 123.
        // The second argument (10) ensures it's parsed as a base-10 number.
        valueToSubmit = parseInt(defaultValue[index], 10);
        // Optional: Add a check for NaN (Not a Number) if the input wasn't a valid integer.
        // This would prevent sending invalid data to the API and could provide better user feedback.
        if (isNaN(valueToSubmit)) {
          console.error(
            "Attempted to submit a non-integer value for an Integer variable:",
            gvname[index],
            defaultValue[index]
          );
          // You might want to update the 'submitted' label with an error here
          // submittedboxid.innerHTML = "Error: Invalid integer value.";
          return; // Stop the submission if it's not a valid number
        }
      }
      // --- ADDED/MODIFIED LINES END HERE ---

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + access_token);

      const raw = JSON.stringify({
        agentEditable: agentEditable[index],
        variableType: variableType[index],
        agentViewable: agentViewable[index],
        reportable: reportable[index],
        active: active[index],
        defaultValue: valueToSubmit, // <--- Use the potentially converted value here
        id: gvid[index],
        name: gvname[index],
        description: description[index],
        sensitive: false,
      });

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(requestOptions);

      fetch(
        "https://api.wxcc-eu1.cisco.com/organization/" +
          org +
          "/cad-variable/" +
          gvid[index],
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => {
          updatelabel(JSON.parse(result));
        })
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function updatelabel(result) {
      var submittedboxid = context.getElementById("submitted");

      // Check for errors
      if (result.error) {
        submittedboxid.innerHTML =
          "Erreur : " + result.error.message[0].description;
      } else {
        submittedboxid.innerHTML = "SuccÃƒÂ¨s!";
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Custom element attributes changed. name: ${name}, oldValue: ${oldValue}, newValue: ${newValue}`
    );
    // console.log(this.currenTask.callAssociatedData);
    // const orderid = this.shadowRoot.getElementById("orderid");
    // orderid.innerHTML = newValue;
  }
}

customElements.define("supervisor-controls-caa", SupervisorControlsCAA);

// ===== TASK VIEWER COMPONENT =====
const taskViewerTemplate = document.createElement("template");
taskViewerTemplate.innerHTML = `
  <div style="padding:10px">
    <h2>Task Viewer</h2>
    <div id="task-table-container"></div>
  </div>
`;

class TaskViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(style.cloneNode(true));
    this.shadowRoot.appendChild(taskViewerTemplate.content.cloneNode(true));

    var org = this.orgId || "fc5af61b-06a3-4122-be5c-bb344cffffdc";
    var access_token = this.accessToken;
    var context = this.shadowRoot;
    var triggerurl =
      "https://europe-west2-token-service-413010.cloudfunctions.net/token-service";
    var tokenname = "wxcctoken";
    var passphrase = this.passPhrase;

    GetAccessToken();

    function GetAccessToken() {
      const myHeaders = new Headers();
      myHeaders.append("x-token-passphrase", passphrase);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(triggerurl + "?name=" + tokenname, requestOptions)
        .then((response) => response.text())
        .then((result) => FetchTasks(JSON.parse(result)))
        .catch((error) => console.log("[TASKVIEWER] - ERROR - ", error));
    }

    function FetchTasks(result) {
      access_token = result.token;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + access_token);

      const raw = JSON.stringify({
        query: `
{
  task(
    from: "1767874520000"
    to: "1767961693000"
    filter:{ 
      and: [
        { channelType: { equals: email } }
        { stringGlobalVariables: {
          name: { equals: "RefSinistre"}
          value: { equals: "S0133"}
        }}
      ]
    }
  ) {
    tasks {
      id 
      status
      createdTime
      customer{
        name
      }
      channelMetaData{
        email{
          subject
        }
      }
      stringGlobalVariables(name: "RefSinistre") {
        name
        value
      }
      TacheFille: stringGlobalVariables(name: "TacheFille") {
        name
        value
      }
      DateReactivation: stringGlobalVariables(name: "DateReactivationTache") {
        name
        value
      }
    }
  }
}
`,
        variables: {},
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(
        "https://api.wxcc-eu1.cisco.com/search?orgId=" + org,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => DisplayTasks(JSON.parse(result), context))
        .catch((error) => console.log("[TASKVIEWER] - ERROR - ", error));
    }

    function DisplayTasks(result, context) {
      const tableContainer = context.getElementById("task-table-container");

      if (!result.data || !result.data.task || !result.data.task.tasks) {
        tableContainer.innerHTML = "<p>No tasks found.</p>";
        return;
      }

      const tasks = result.data.task.tasks;
      tableContainer.innerHTML = generateTaskTable(tasks);
    }

    function generateTaskTable(tasks) {
      let table = '<table style="width:100%; border-collapse: collapse;">';
      table += `
        <thead>
          <tr style="background-color: #00a0d1; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Name</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Channel</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Time</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Email Subject</th>
          </tr>
        </thead>
        <tbody>
      `;

      tasks.forEach((task, index) => {
        const name = task.customer?.name || "N/A";
        const channel = "email"; // From the query filter
        const time = task.createdTime
          ? new Date(task.createdTime).toLocaleString()
          : "N/A";
        const subject = task.channelMetaData?.email?.subject || "N/A";

        const rowColor = index % 2 === 0 ? "#f4f4f4" : "white";

        table += `
          <tr style="background-color: ${rowColor};">
            <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${channel}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${time}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${subject}</td>
          </tr>
        `;
      });

      table += "</tbody></table>";
      return table;
    }
  }

  static get observedAttributes() {
    return ["orgId", "accessToken", "passPhrase"];
  }

  get orgId() {
    return this.getAttribute("orgId");
  }

  get accessToken() {
    return this.getAttribute("accessToken");
  }

  get passPhrase() {
    return this.getAttribute("passPhrase");
  }
}

customElements.define("task-viewer", TaskViewer);
