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
