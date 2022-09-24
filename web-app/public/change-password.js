const changePasswordBtn = document.querySelector('button#changePasswordBtn');
const form = document.querySelector('form');

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
    setTimeout(() => alertDiv.innerHTML = "", 3000)
};

async function changePassword() {
    const formData = new FormData(form);
    let obj = {};

    for (const [key, value] of formData.entries()) {
        console.log(key, value)
        obj[key] = value
    };

    if (!obj["currentPassword"]) {
        showAlert(`Current Password can't be empty`)
        return
    }

    if (!obj["newPassword"] || !obj["confirmPassword"]) {
        showAlert(`New / Confirm Password can't be empty`)
        return
    }

    const response = await fetch(`${window.location.origin}/change-password`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(obj)
    });
    if (response.status == 200) {
        const { message } = await response.json()
        showAlert(message, "success")
    };
    if (response.status == 403) {
        const { error } = await response.json()
        showAlert(error)
    }
};

changePasswordBtn.addEventListener('click', async () => {
    await changePassword()
});