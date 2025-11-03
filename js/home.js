

const API_BASE_URL = 'http://ec2-54-196-207-55.compute-1.amazonaws.com/api';

// IDs simulados (en producción vendrían de un sistema de autenticación)
let currentUserId = null;
let currentStreamId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Aplicación iniciada');

    // Inicializar datos de prueba
    await initializeApp();

    // Configurar event listeners
    setupEventListeners();

    // Cargar posts del timeline
    await loadTimeline();
});



async function initializeApp() {
    try {
        // Crear usuario de prueba si no existe
        currentUserId = await getOrCreateTestUser();

        // Crear stream de prueba si no existe
        currentStreamId = await getOrCreateTestStream();

        console.log('Usuario ID:', currentUserId);
        console.log('Stream ID:', currentStreamId);
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
    }
}

async function getOrCreateTestUser() {
    try {
        // Intentar obtener usuario por email
        const response = await fetch(`${API_BASE_URL}/users/email/test@example.com`);

        if (response.ok) {
            const user = await response.json();
            return user.id;
        }

        // Si no existe, crear usuario
        const newUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            displayName: 'Usuario de Prueba',
            bio: 'Este es un usuario de prueba'
        };

        const createResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        if (createResponse.ok) {
            const user = await createResponse.json();
            return user.id;
        }

        throw new Error('No se pudo crear el usuario');
    } catch (error) {
        console.error('Error con usuario:', error);
        return null;
    }
}

async function getOrCreateTestStream() {
    try {
        // Intentar obtener stream por nombre
        const response = await fetch(`${API_BASE_URL}/streams/name/Timeline Principal`);

        if (response.ok) {
            const stream = await response.json();
            return stream.id;
        }

        // Si no existe, crear stream
        const newStream = {
            name: 'Timeline Principal',
            description: 'Stream principal del timeline',
            isPublic: true
        };

        const createResponse = await fetch(`${API_BASE_URL}/streams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStream)
        });

        if (createResponse.ok) {
            const stream = await createResponse.json();
            return stream.id;
        }

        throw new Error('No se pudo crear el stream');
    } catch (error) {
        console.error('Error con stream:', error);
        return null;
    }
}

// =========================================
// EVENT LISTENERS
// =========================================

function setupEventListeners() {
    // Contador de caracteres
    const tweetInput = document.querySelector('.tweet-input');
    const charCounter = document.querySelector('.char-counter');

    tweetInput.addEventListener('input', () => {
        const remaining = 140 - tweetInput.value.length;
        charCounter.textContent = remaining;

        if (remaining < 0) {
            charCounter.style.color = '#e0245e';
        } else if (remaining < 20) {
            charCounter.style.color = '#ffad1f';
        } else {
            charCounter.style.color = '#657786';
        }
    });

    // Botón de twittear
    const tweetButton = document.querySelector('.tweet-submit-button');
    tweetButton.addEventListener('click', handleCreatePost);

    // Enter para enviar (Ctrl+Enter)
    tweetInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleCreatePost();
        }
    });
}

// =========================================
// CRUD - CREATE
// =========================================

async function handleCreatePost() {
    const tweetInput = document.querySelector('.tweet-input');
    const content = tweetInput.value.trim();

    if (!content) {
        alert('El tweet no puede estar vacío');
        return;
    }

    if (content.length > 140) {
        alert('El tweet no puede tener más de 140 caracteres');
        return;
    }

    if (!currentUserId || !currentStreamId) {
        alert('Error: Usuario o Stream no inicializados');
        return;
    }

    try {
        const post = await createPost(currentUserId, currentStreamId, content);

        if (post) {
            console.log('Post creado:', post);

            // Limpiar input
            tweetInput.value = '';
            document.querySelector('.char-counter').textContent = '140';

            // Recargar timeline
            await loadTimeline();

            // Mostrar notificación de éxito
            showNotification('Tweet publicado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error creando post:', error);
        showNotification('Error al publicar el tweet', 'error');
    }
}

async function createPost(userId, streamId, content) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                streamId: streamId,
                content: content
            })
        });

        if (response.ok) {
            return await response.json();
        }

        throw new Error('Error al crear el post');
    } catch (error) {
        console.error('Error en createPost:', error);
        throw error;
    }
}

// =========================================
// CRUD - READ
// =========================================

async function loadTimeline() {
    if (!currentStreamId) {
        console.error('Stream ID no disponible');
        return;
    }

    try {
        const posts = await getPostsByStream(currentStreamId);
        displayPosts(posts);
    } catch (error) {
        console.error('Error cargando timeline:', error);
        showNotification('Error al cargar los tweets', 'error');
    }
}

async function getPostsByStream(streamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/stream/${streamId}`);

        if (response.ok) {
            return await response.json();
        }

        return [];
    } catch (error) {
        console.error('Error en getPostsByStream:', error);
        return [];
    }
}

async function getPostById(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`);

        if (response.ok) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('Error en getPostById:', error);
        return null;
    }
}

// =========================================
// CRUD - UPDATE
// =========================================

async function updatePost(postId, newContent) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: newContent
            })
        });

        if (response.ok) {
            return await response.json();
        }

        throw new Error('Error al actualizar el post');
    } catch (error) {
        console.error('Error en updatePost:', error);
        throw error;
    }
}

// =========================================
// CRUD - DELETE
// =========================================

async function deletePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE'
        });

        return response.ok;
    } catch (error) {
        console.error('Error en deletePost:', error);
        return false;
    }
}

// =========================================
// INTERACCIONES (LIKES, RETWEETS, REPLIES)
// =========================================

async function toggleLike(postId) {
    try {
        // Aquí podrías implementar lógica para verificar si ya dio like
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/likes/increment`, {
            method: 'POST'
        });

        if (response.ok) {
            await loadTimeline();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error en toggleLike:', error);
        return false;
    }
}

async function toggleRetweet(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/retweets/increment`, {
            method: 'POST'
        });

        if (response.ok) {
            await loadTimeline();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error en toggleRetweet:', error);
        return false;
    }
}

// =========================================
// RENDERIZADO DE POSTS
// =========================================

function displayPosts(posts) {
    const timeline = document.querySelector('.timeline');

    // Buscar el formulario de compose
    const composeTweet = document.querySelector('.compose-tweet');

    // Eliminar todos los tweets existentes
    const existingTweets = timeline.querySelectorAll('.tweet');
    existingTweets.forEach(tweet => tweet.remove());

    // Si no hay posts, mostrar mensaje
    if (!posts || posts.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-timeline';
        emptyMessage.innerHTML = '<p>No hay tweets todavía. ¡Sé el primero en publicar!</p>';
        timeline.appendChild(emptyMessage);
        return;
    }

    // Renderizar cada post
    posts.forEach(post => {
        const tweetElement = createTweetElement(post);
        timeline.appendChild(tweetElement);
    });
}

function createTweetElement(post) {
    const article = document.createElement('article');
    article.className = 'tweet';
    article.dataset.postId = post.id;

    // Calcular tiempo relativo
    const timeAgo = getTimeAgo(post.createdAt);

    article.innerHTML = `
        <div class="tweet-avatar">
            <div class="avatar"></div>
        </div>
        <div class="tweet-content">
            <div class="tweet-header">
                <span class="tweet-author">${post.user.displayName || post.user.username}</span>
                <span class="tweet-username">@${post.user.username}</span>
                <span class="tweet-time">· ${timeAgo}</span>
                ${post.isEdited ? '<span class="tweet-edited">(editado)</span>' : ''}
            </div>
            <p class="tweet-text">${escapeHtml(post.content)}</p>
            <div class="tweet-actions">
                <button class="action-button reply-button" onclick="handleReply('${post.id}')">
                    💬 <span>${post.repliesCount || 0}</span>
                </button>
                <button class="action-button retweet-button" onclick="handleRetweet('${post.id}')">
                    🔄 <span>${post.retweetsCount || 0}</span>
                </button>
                <button class="action-button like-button" onclick="handleLike('${post.id}')">
                    ❤️ <span>${post.likesCount || 0}</span>
                </button>
                <button class="action-button share-button">
                    📤
                </button>
                <button class="action-button delete-button" onclick="handleDelete('${post.id}')" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
    `;

    return article;
}

// =========================================
// HANDLERS DE INTERACCIONES
// =========================================

async function handleLike(postId) {
    try {
        await toggleLike(postId);
        showNotification('Like registrado', 'success');
    } catch (error) {
        console.error('Error al dar like:', error);
    }
}

async function handleRetweet(postId) {
    try {
        await toggleRetweet(postId);
        showNotification('Retweet registrado', 'success');
    } catch (error) {
        console.error('Error al hacer retweet:', error);
    }
}

async function handleReply(postId) {
    console.log('Reply a post:', postId);
    // Aquí podrías implementar un modal o expandir el tweet para responder
    alert('Funcionalidad de respuestas en desarrollo');
}

async function handleDelete(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este tweet?')) {
        return;
    }

    try {
        const success = await deletePost(postId);

        if (success) {
            await loadTimeline();
            showNotification('Tweet eliminado', 'success');
        } else {
            showNotification('Error al eliminar el tweet', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar post:', error);
        showNotification('Error al eliminar el tweet', 'error');
    }
}

// =========================================
// UTILIDADES
// =========================================

function getTimeAgo(timestamp) {
    if (!timestamp) return 'ahora';

    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

    return postDate.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Agregar al body
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// =========================================
// FUNCIONES GLOBALES (expuestas para onclick)
// =========================================

window.handleLike = handleLike;
window.handleRetweet = handleRetweet;
window.handleReply = handleReply;
window.handleDelete = handleDelete;