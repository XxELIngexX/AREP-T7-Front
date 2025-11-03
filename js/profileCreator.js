const BASE_URL = "http://ec2-54-196-207-55.compute-1.amazonaws.com:8080";
let access_token = null;
let id_token = null;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code"); // ESTE ES EL CÓDIGO QUE DEVUELVE COGNITO
  const state = urlParams.get("state");

  if (code) {
    console.log("Código OAuth recibido:", code);

    // Llamas al backend para intercambiar code por tokens
    await fetch(`http://ec2-54-196-207-55.compute-1.amazonaws.com:8080/auth/callback?code=${code}&state=${state}`)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("id_token", data.id_token);
        console.log("Tokens almacenados en localStorage.");
      })
      .catch(err => {
        console.error("Error al pedir tokens al backend:", err);
      });
  }



  const displayNameInput = document.getElementById("displayName");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const submitButton = document.getElementById("submitButton");
  const loadingMessage = document.getElementById("loadingMessage");
  const errorMessage = document.getElementById("errorMessage");

  // Función que valida si puede habilitar el botón
  const validateForm = () => {
    const nameFilled = displayNameInput.value.trim() !== "";
    const emailFilled = emailInput.value.trim() !== "";
    const usernameFilled = usernameInput.value.trim() !== "";

    if (nameFilled && emailFilled && usernameFilled) {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  };

  // Escuchar cambios en el username
  usernameInput.addEventListener("input", validateForm);

  // Cargar datos del usuario desde el backend
  loadingMessage.style.display = "flex";
  const idToken = localStorage.getItem("id_token");
  await fetch(`${BASE_URL}/api/users/me`, {
    headers: {
      "Authorization": `Bearer ${idToken}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al obtener datos del usuario");
      return res.json();
    })
    .then(user => {
      console.log(user);
      displayNameInput.value = user.displayName || "";
      usernameInput.value = user.username || "";
      emailInput.value = user.email || "";
      validateForm(); // Checar si ya se pueden habilitar
    })
    .catch(err => {
      console.error("Error:", err);
      errorMessage.style.display = "flex";
      errorMessage.querySelector("span").textContent = "No se pudieron cargar tus datos.";
    })
    .finally(() => {
      loadingMessage.style.display = "none";
    });
});

document.getElementById("profileCreatorForm").addEventListener("submit", async function (event) {
  event.preventDefault(); // Prevenir el envío normal del formulario
  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = true; // Deshabilitar el botón para evitar múltiples envíos

  const formData = {
    displayName: document.getElementById("displayName").value.trim(),
    email: document.getElementById("email").value.trim(),
    username: document.getElementById("username").value.trim(),
    bio: document.getElementById("bio").value.trim(),
    location: document.getElementById("location").value.trim(),
    webSite: document.getElementById("website").value.trim()
  };
  await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("id_token")}`,
      "Content-Type": "application/json"

    },
    body: JSON.stringify(formData)
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al crear el perfil");
      // Redirigir al usuario al feed principal
      window.location.href = "/profile";
    })
    .catch(err => {
      console.error("Error:", err);
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.style.display = "flex";
      errorMessage.querySelector("span").textContent = "No se pudo crear el perfil. Intenta de nuevo.";
    })
    .finally(() => {
      submitButton.disabled = false; // Rehabilitar el botón
    });
});