const BASE_URL = "http://localhost:8080";
let user = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (user === null || user === undefined || !user) {
            user = await fetchUserProfile();
        }
        const userMetaDiv = document.querySelector(".user-meta");
        if (!userMetaDiv) return console.error("No se encontró .user-meta en el DOM");

        // Crea el HTML dinámico
        userMetaDiv.innerHTML = `
      <h1 class="user-name">${user.displayName}</h1>
      <p class="user-username">@${user.username}</p>
      <p class="user-bio">${user.bio || "Sin biografía definida"}<br></p>
      <div class="user-stats">
        <span><strong>${user.postsCount || 0}</strong> Posts</span>
        <span><strong>${user.followingCount || 0}</strong> Siguiendo</span>
        <span><strong>${user.followersCount || 0}</strong> Seguidores</span>
      </div>
      <button class="edit-profile-btn">Editar perfil</button>

    `;

        renderPosts(user);

    } catch (error) {
        console.error("No se pudo cargar el perfil:", error);
    }
});

document.getElementById("post-btn").addEventListener("click", async function (e) {
    e.preventDefault();
    const postContent = document.getElementById("post-content").value.trim();
    if (!postContent) return alert("El post está vacío.");

    if (!user) {
        console.warn("No había user en memoria, intentando cargarlo...");
        user = await fetchUserProfile();
    }

    const userId = user?.id;
    if (!userId) {
        console.error("Faltan datos del usuario");
        alert("No se pudo identificar el usuario.");
        return;
    }

    const postData = {
        userId: userId,
        content: postContent
    };

    fetch(`${BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
    })
        .then(res => {
            if (!res.ok) throw new Error("Error al crear el post");
            return res.json();
        })
        .then(createdPost => {
            console.log("Post creado:", createdPost);
            // Recargar la página o actualizar dinámicamente el feed
            window.location.reload();
        })
        .catch(err => {
            console.error("Error:", err);
            alert("No se pudo crear el post. Intenta de nuevo.");
        });

    renderPosts();
});

async function renderPosts(user) {
    try {
        let posts = user.posts;
        if (!posts) {
            const response = await fetch(`${BASE_URL}/api/users/me`);
            if (!response.ok) throw new Error("Error al obtener posts del usuario");
            posts = await response.json();
        }

        const postsContainer = document.getElementById("posts-container");

        postsContainer.innerHTML = ""; // Limpiar posts anteriores

        posts.forEach(post => {
            const article = document.createElement("article");
            article.classList.add("post");

            article.innerHTML = `
        <div class="post-avatar">
            <div class="avatar small"></div>
        </div>
        <div class="post-content">
            <div class="post-header">
                <span class="post-author">${user.displayName}</span>
                <span class="post-username">@${user.username}</span>
            <button class="delete-btn" data-id="${post.id}" title="Eliminar post">🗑️</button>
            </div>
            <p class="post-text">${post.content}</p>
        </div>
        `;

            const deleteBtn = article.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                const postId = e.target.getAttribute("data-id");
                const confirmDelete = confirm("¿Seguro que quieres eliminar este post?");
                if (!confirmDelete) return;

                try {
                    const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("id_token")}`,
                            "Content-Type": "application/json"
                        }
                    });

                    if (!res.ok) throw new Error("Error al eliminar el post");

                    article.remove(); // elimina del DOM directamente
                    console.log(`Post ${postId} eliminado correctamente.`);

                } catch (err) {
                    console.error("Error:", err);
                    alert("No se pudo eliminar el post. Intenta de nuevo.");
                }
            });

            postsContainer.appendChild(article);
        });
    } catch (error) {
        console.error("No se pudieron cargar los posts:", error);
    }
}

async function fetchUserProfile() {
  const idToken = localStorage.getItem("id_token");
  if (!idToken) throw new Error("Faltan tokens de autenticación");

  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { "Authorization": `Bearer ${idToken}` }
    });

    if (!res.ok) throw new Error("Error al obtener datos del usuario");
    const usr = await res.json();

    // Guardamos el user global y en localStorage
    user = usr;
    localStorage.setItem("user", JSON.stringify(usr));

    console.log("Perfil cargado:", usr);
    return usr; // 👈 esto es lo que faltaba
  } catch (err) {
    console.error("Error:", err);
    alert("No se pudieron cargar tus datos.");
    return null; // 👈 importante retornar algo
  }
}
