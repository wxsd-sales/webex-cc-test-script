const style = document.createElement("style");
const template = document.createElement("template");

style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");

table {
  border-collapse: collapse;
  width: 100%;
  font-family: 'Roboto', sans-serif;
}

th {
  background-color: #00a0d1;
  color: white;
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
  font-weight: 700;
}

td {
  padding: 10px;
  border: 1px solid #ddd;
}

tr:nth-child(even) {
  background-color: #f4f4f4;
}

tr:nth-child(odd) {
  background-color: white;
}

h2 {
  color: #333;
  font-weight: 700;
  font-family: 'Roboto', sans-serif;
}
`;

template.innerHTML = `
  <div style="padding:10px">
    <h2>Task Viewer</h2>
    <div id="task-table-container"></div>
  </div>
`;

class TaskViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.timeoutID = undefined;
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.appendChild(style);

    var org = this.orgId;
    var context = this.shadowRoot;
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
        .then((result) => FetchTasks(JSON.parse(result)))
        .catch((error) => console.log("[TASKVIEWER] - ERROR - ", error));
    }

    function FetchTasks(result) {
      access_token = result.token;
      console.log("[TASKVIEWER] - Access token retrieved");

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
      console.log(requestOptions);

      fetch(
        "https://api.wxcc-eu1.cisco.com/search?orgId=" + org,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => DisplayTasks(JSON.parse(result), context))
        .catch((error) => console.log("[TASKVIEWER] - ERROR - ", error));
    }

    function DisplayTasks(result, context) {
      console.log("[TASKVIEWER] - Got result:", result);
      const tableContainer = context.getElementById("task-table-container");

      if (!result.data || !result.data.task || !result.data.task.tasks) {
        tableContainer.innerHTML = "<p>No tasks found.</p>";
        return;
      }

      const tasks = result.data.task.tasks;
      tableContainer.innerHTML = generateTaskTable(tasks);
    }

    function generateTaskTable(tasks) {
      let table = '<table style="width:100%;">';
      table += `
        <thead>
          <tr>
            <th>Name</th>
            <th>Channel</th>
            <th>Time</th>
            <th>Email Subject</th>
          </tr>
        </thead>
        <tbody>
      `;

      tasks.forEach((task, index) => {
        const name = task.customer?.name || "N/A";
        const channel = "email";
        const time = task.createdTime
          ? new Date(task.createdTime).toLocaleString()
          : "N/A";
        const subject = task.channelMetaData?.email?.subject || "N/A";

        table += `
          <tr>
            <td>${name}</td>
            <td>${channel}</td>
            <td>${time}</td>
            <td>${subject}</td>
          </tr>
        `;
      });

      table += "</tbody></table>";
      return table;
    }
  }

  static get observedAttributes() {
    return ["orgid", "passphrase"];
  }

  get orgId() {
    return this.getAttribute("orgid");
  }

  get passPhrase() {
    return this.getAttribute("passphrase");
  }
}

customElements.define("task-viewer", TaskViewer);
