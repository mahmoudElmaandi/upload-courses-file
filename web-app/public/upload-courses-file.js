const selectDiv = document.querySelector('#selectDiv');
const requestLogsDiv = document.querySelector("#requestLogs");
const deleteCoursesFileBtn = document.querySelector('button#deleteCoursesFileBtn');

const collapseBtn = document.querySelector('button#collapseBtn');
const collapseCoursesFileDiv = document.querySelector('#collapseCoursesFileDiv');

const csvCoursesFileInput = document.querySelector('input#csvCoursesFileInput');
const addCoursesFileBtn = document.querySelector('button#addCoursesFileBtn');

const delDeviceBtn = document.querySelector('button#delDeviceBtn');

const deleteAllFilesBtn = document.querySelector('button#deleteAllFilesBtn');

const fetchAlertsDiv = document.querySelector('#fetchingTxs-alerts');
const addingDAlerts = document.querySelector('#addingD-alerts');


const logOutBtn = document.querySelector('button#logOutBtn');
const hideSecBtn = document.querySelector('button#hideSecBtn');
const header = document.querySelector('#header');
const coursesFileInfoDiv = document.querySelector("#coursesFileInfo")

const alertTime = 3500;
const loadinDevicesTime = 1000;

function createSelect(devices) {
    const select = document.createElement('select');
    select.setAttribute("id", "select-file")
    select.setAttribute("class", "form-select form-select-lg mb-3")
    select.setAttribute("aria-label", ".form-select-lg")
    const firstOption = document.createElement('option');
    firstOption.innerText = `اختر ملف`
    select.append(firstOption)

    devices.map(coursesFile => {
        const option = document.createElement('option');
        option.setAttribute('name', coursesFile.name);
        option.setAttribute('description', coursesFile.description);
        option.setAttribute('content', coursesFile.content);
        option.setAttribute('department', coursesFile.department);
        option.setAttribute('term', coursesFile.term);
        option.innerText = coursesFile.name
        select.append(option)
    })
    return select
};

async function fetchTxsAPI(api) {
    let response = await fetch(api)
    return response
}

function isDatesValid() {
    const from = document.querySelector('input[id="from"]').value;
    const to = document.querySelector('input[id="to"]').value;
    if (!from || !to) {
        showAlert("Please select from and to date", fetchAlertsDiv)
        return false
    }
    return true
};

function disableBtns() {
    deleteCoursesFileBtn.disabled = true;
    deleteCoursesFileBtn.style.cursor = "not-allowed";

    deleteAllFilesBtn.style.cursor = "not-allowed";
    deleteAllFilesBtn.disabled = true;

    document.querySelector('select#select-device').disabled = true;
};

function enableBtns() {
    deleteCoursesFileBtn.style.cursor = "pointer";
    deleteCoursesFileBtn.disabled = false;
    deleteCoursesFileBtn.innerHTML = `<i class="bi bi-collection-fill"></i> Fetch Transactions`;

    deleteAllFilesBtn.style.cursor = "pointer";
    deleteAllFilesBtn.disabled = false;
    deleteAllFilesBtn.innerHTML = `<i class="bi bi-collection-fill"></i> Fetch Transactions for all devices`;
    document.querySelector('select#select-device').disabled = false;

}


function showAlert(alertText, alertDiv, alertType = "warning") {
    const alert = document.createElement('div');
    const i = document.createElement('i')
    if (alertType == "warning") i.setAttribute("class", "bi bi-exclamation-triangle-fill");
    else i.setAttribute("class", "bi bi-info-square-fill");
    alert.append(i)
    alert.setAttribute("class", `alert alert-${alertType}`)
    alert.setAttribute("role", "alert")
    alert.append(` ${alertText}.`)
    if (alertDiv.id == "fetchingTxs-alerts") {
        alertDiv.append(alert);
    } else {
        alertDiv.insertBefore(alert, alertDiv.firstChild);
    }
    setTimeout(() => alertDiv.innerHTML = "", alertTime)
};

function logRequestStatus(status, fileName, message) {
    const header = document.createElement('h5');

    const span = document.createElement('span');
    span.setAttribute("class", `badge text-bg-${status}`)
    span.innerText = fileName;

    header.append(span);
    header.append(` ${message}`);
    requestLogsDiv.append(header)
};

function appenSpinner(btn) {
    const span = document.createElement('span');
    span.setAttribute("class", "spinner-border spinner-border-sm")
    span.setAttribute("role", "status")
    span.setAttribute("aria-hidden", "true")
    btn.innerHTML = "";
    btn.append(span);
    btn.append(" Fetching Transactions...");
};


function collapse() {
    if (collapseBtn.classList.contains("collapsed")) {
        collapseBtn.classList.remove("collapsed")
        collapseBtn.setAttribute("aria-expanded", "false")
        collapseCoursesFileDiv.classList.remove("show")
    } else {
        collapseBtn.classList.add("collapsed")
        collapseBtn.setAttribute("aria-expanded", "true")
        collapseCoursesFileDiv.classList.add("show")
    }
};

async function sendCoursesFile(name, description, content, department, term) {
    const response = await fetch(`${window.location.origin}/courses-files`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ "name": name.trim(), "description": description, "content": content, department, term })
    });

    const data = await response.json();
    if (response.status == 200) {
        const { message } = data;
        showAlert(message, addingDAlerts, 'success');
        await fetchCoursesFiles();
    };

    if (response.status != 200) {
        const { errors } = data;
        errors.forEach(error => showAlert(error["error"], addingDAlerts))
    }
};

async function addCourseFile() {
    const cInputName = document.querySelector('input#cInputName').value;
    let cInputDes = document.querySelector('input#cInputDes').value;
    let cInputDep = document.querySelector('input#dep').value;
    let cInputterm = document.querySelector('input#term').value;

    if (!(cInputName.replace("CS-", ""))) showAlert(`لا يمكن ترك الاسم فارغا`, addingDAlerts);
    if (!cInputDes) showAlert(`لا يمكن ترك الوصف فارغا`, addingDAlerts);
    if (!cInputDep) showAlert(`لا يمكن ترك القسم فارغا`, addingDAlerts);
    if (!cInputterm) showAlert(`لا يمكن ترك الفصل الدراسي فارغا`, addingDAlerts);

    if (!csvCoursesFileInput.files.length) {
        showAlert(`يرجى رفع ملف مواد`, addingDAlerts);
        return
    };

    var reader = new FileReader();
    reader.readAsText(csvCoursesFileInput.files[0]);
    reader.onload = async function (e) {
        const courseFileInfo = e.target.result.trim();
        await sendCoursesFile(cInputName, cInputDes, courseFileInfo, cInputDep, cInputterm)
    }
};

async function fetchCoursesFiles() {
    const response = await fetch(`${window.location.origin}/courses-files`);
    let coursesFiles = await response.json();

    if (coursesFiles.length) {
        deleteCoursesFileBtn.disabled = false;
        deleteAllFilesBtn.disabled = false;
        setTimeout(() => {
            const select = createSelect(coursesFiles);
            select.addEventListener('change', showCourseInfoFile)
            selectDiv.innerHTML = "";
            selectDiv.append(select);
        }, loadinDevicesTime)
    };
    if (!coursesFiles.length) {
        selectDiv.innerHTML = "لا توجد ملفات";
        deleteCoursesFileBtn.disabled = true;
        deleteAllFilesBtn.disabled = true;
    }
};

function showCourseInfoFile() {
    const fileSelect = document.querySelector('select#select-file');
    const selectedOption = fileSelect.selectedOptions[0];
    const name = selectedOption.getAttribute('name');
    const description = selectedOption.getAttribute('description');
    let content = selectedOption.getAttribute('content');
    let department = selectedOption.getAttribute('department');
    let term = selectedOption.getAttribute('term');

    // console.log(selectedOption)
    content = content.replace(/\r\n/g, '<br>');
    // console.log(content)
    coursesFileInfoDiv.innerHTML = ""
    coursesFileInfoDiv.innerHTML =

        `
   <b> اسم الملف </b>: ${name}
    <br>
    <b> وصف الملف </b>: ${description}
    <br>
    <b> القسم</b>: ${department}
    <br>
    <b> الفصل الدراسي</b>: ${term}
    <br>
    <b> محتوى الملف </b>
    <br>
    <p>
    ${content}
    </p>
    `
};

async function deleteCoursesFile(delType) {
    const fileSelect = document.querySelector('select#select-file');
    if (delType == "single" && fileSelect.selectedIndex == 0) {
        showAlert(`يرجى اختيار ملف`, fetchAlertsDiv);
        return
    }


    const coursesFiles = [];
    if (delType == "single") {
        const selectedOption = fileSelect.selectedOptions[0];
        const name = selectedOption.getAttribute('name');
        coursesFiles.push(name)
    }

    if (delType == "bulk") {
        Array.from(fileSelect.options).forEach((option, index) => {
            if (index != 0) coursesFiles.push(option.getAttribute('name'))
        })
    }

    for (let index = 0; index < coursesFiles.length; index++) {
        const name = coursesFiles[index];

        const response = await fetch(`${window.location.origin}/courses-files`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            method: "DELETE",
            body: JSON.stringify({ "name": name.trim() })
        });

        const data = await response.json();

        if (response.status == 200) {
            const { message } = data;
            showAlert(message, addingDAlerts, 'danger');
            await fetchCoursesFiles();
        };

        if (response.status != 200) {
            const { error } = data;
            showAlert(error, addingDAlerts)
        }
    }
};


function logOut() {
    document.cookie = "token=";
    window.location.href = `${window.location.origin}/login`
    window.location.assign(`${window.location.origin}/login`)
};

function hideHSec() {
    if (header.style.display == "none") {
        header.style.display = "block"
    } else {
        header.style.display = "none"
    }
};

(async () => {
    await fetchCoursesFiles();


    collapseBtn.addEventListener('click', collapse);


    addCoursesFileBtn.addEventListener('click', async () => {
        await addCourseFile()
    });

    deleteCoursesFileBtn.addEventListener('click', async () => {
        await deleteCoursesFile("single")
    });

    deleteAllFilesBtn.addEventListener('click', async () => {
        await deleteCoursesFile("bulk")
    });

    logOutBtn.addEventListener('click', logOut);
    // hideSecBtn.addEventListener('click', hideHSec);
})()