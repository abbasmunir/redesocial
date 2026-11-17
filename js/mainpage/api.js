const url = 'https://ifsp.trojahn.uk/redesocial/usuarios/';
const urlBase = 'https://ifsp.trojahn.uk/redesocial/';

function getAuthHeader(token) {
    if (!token) return {};
    const tokenLimpo = token.toString().trim().replace(/^["']|["']$/g, '');
    return { "Authorization": `Bearer ${tokenLimpo}` };
}

async function handleResponse(response) {
    if (response.ok) {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.msg || "Erro na requisição");
}

// --- USUÁRIOS & LOGIN ---
export async function apiBuscarUsuarios() {
    const res = await fetch(url);
    return handleResponse(res);
}

export async function apiCadastrarUsuario(novoUsuario) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario)
    });
    return handleResponse(res);
}

export async function apiLogin(credenciais) {
    const res = await fetch(`${urlBase}usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credenciais)
    });
    return handleResponse(res);
}

// --- POSTS ---
export async function apiBuscarPosts() {
    const res = await fetch(`${urlBase}posts`);
    return handleResponse(res);
}

export async function apiCriarPost(post, token) {
    const res = await fetch(`${urlBase}posts`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader(token)
        },
        body: JSON.stringify(post)
    });
    return handleResponse(res);
}

export async function apiDeletarPost(idPost, token) {
    const res = await fetch(`${urlBase}posts/${idPost}`, {
        method: "DELETE",
        headers: getAuthHeader(token)
    });
    return handleResponse(res);
}

export async function apiEditarPost(idPost, postAtualizado, token) {
    const res = await fetch(`${urlBase}posts/${idPost}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader(token)
        },
        body: JSON.stringify(postAtualizado)
    });
    return handleResponse(res);
}

// --- LIKES ---
export async function apiToggleLike(idPost, token) {
    const res = await fetch(`${urlBase}posts/${idPost}/likes`, {
        method: "POST", 
        headers: getAuthHeader(token)
    });
    return handleResponse(res);
}

// --- COMENTÁRIOS ---
export async function apiBuscarComentarios(idPost) {
    const res = await fetch(`${urlBase}posts/${idPost}/comentarios`);
    return handleResponse(res);
}

export async function apiCriarComentario(idPost, comentario, token) {
    const res = await fetch(`${urlBase}posts/${idPost}/comentarios`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader(token)
        },
        body: JSON.stringify(comentario)
    });
    return handleResponse(res);
}

export async function apiEditarComentario(idComentario, comentarioAtualizado, token) {
    const res = await fetch(`${urlBase}comentarios/${idComentario}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader(token)
        },
        body: JSON.stringify(comentarioAtualizado)
    });
    return handleResponse(res);
}

export async function apiDeletarComentario(idComentario, token) {
    const res = await fetch(`${urlBase}comentarios/${idComentario}`, {
        method: "DELETE",
        headers: getAuthHeader(token)
    });
    return handleResponse(res);
}

export async function apiAtualizarUsuario(idUsuario, dadosAtualizados, token) {
    const res = await fetch(`${urlBase}usuarios/${idUsuario}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader(token)
        },
        body: JSON.stringify(dadosAtualizados)
    });
    return handleResponse(res);
}