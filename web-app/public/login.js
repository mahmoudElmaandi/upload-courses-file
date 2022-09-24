const loginBtn = document.querySelector('button#login');

loginBtn.addEventListener('click', async () => {
    const password = document.querySelector('input#password').value;
    if (!password) return;
    await login(password)
});

const alertDiv = document.querySelector('#alerts');

function showAlert(alertText, alertType = "warning") {
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
    setTimeout(() => alertDiv.innerHTML = "", 1500)
};

async function login(password) {

    const response = await fetch(`${window.location.origin}/upload-courses-file.html`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ password })
    });

    if (response.status == 200) {
        showAlert(` جاري تسجيل الدخول ...`, "success")
        setTimeout(() => {
            window.location.assign(response.url);
            window.location.href = response.url;
        }, 2000)
    }

    if (response.status == 403) {
        const { error } = await response.json()
        showAlert(error)
    }
}