import {  
    apiCadastrarUsuario, 
    apiLogin, 
    apiBuscarPosts, 
    apiBuscarUsuarios,
    apiCriarPost, 
    apiDeletarPost, 
    apiEditarPost,
    apiToggleLike,
    apiBuscarComentarios,
    apiCriarComentario,
    apiEditarComentario,
    apiDeletarComentario
} from './api.js';

import { salvarPerfilFirebase, obterPerfilFirebase } from './perfil.js';

document.addEventListener("DOMContentLoaded", () => {
    verificarEstadoLogado();
    inicializarEventosAutenticacaoENavegacao();
    configurarModalEdicao();
    configurarDelegacaoEventosTimeline();
});

function obterUsuarioLogado() {
    const usuarioStr = localStorage.getItem("usuarioLogado");
    return usuarioStr ? JSON.parse(usuarioStr) : null;
}

function verificarEstadoLogado() {
    const usuarioLogado = obterUsuarioLogado();
    const authSection = document.getElementById("auth-section");
    const feedSection = document.getElementById("feed-section");

    if (usuarioLogado) {
        authSection.style.display = "none";
        feedSection.style.display = "block";
        document.getElementById("user-welcome").innerText = `PLAYER 1: ${usuarioLogado.nome}`;
        carregarFeed();
    } else {
        authSection.style.display = "block";
        feedSection.style.display = "none";
    }
}

function inicializarEventosAutenticacaoENavegacao() {
    const formCadastro = document.getElementById("cadastro");
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novoUsuario = {
                login: document.getElementById("login").value.trim(),
                senha: document.getElementById("senha").value,
                nome: document.getElementById("nome").value.trim(),
                img: ""
            };
            try {
                await apiCadastrarUsuario(novoUsuario);
                alert("Cadastro realizado com sucesso! Faça o login.");
                formCadastro.reset();
            } catch (err) {
                alert("Erro no cadastro: " + err.message);
            }
        });
    }

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const credenciais = {
                login: document.getElementById("login-email").value.trim(),
                senha: document.getElementById("login-senha").value
            };

            try {
                const resposta = await apiLogin(credenciais);
                const dadosSessao = {
                    token: resposta.token,
                    id: resposta.usuario.id,
                    login: resposta.usuario.login,
                    nome: resposta.usuario.nome,
                    img: resposta.usuario.img
                };
                localStorage.setItem("usuarioLogado", JSON.stringify(dadosSessao));
                verificarEstadoLogado();
            } catch (err) {
                console.error("[DEBUG LOGIN] Falha:", err);
                alert("Falha no login: " + err.message);
            }
        });
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("usuarioLogado");
            verificarEstadoLogado();
        });
    }

    const btnPublicar = document.getElementById("btn-publicar");
    if (btnPublicar) {
        btnPublicar.addEventListener('click', async (e) => {
            e.preventDefault();
            const conteudo = document.getElementById("conteudo-post").value.trim();
            const inputImg = document.getElementById("input-img-post");
            const imagemUrl = inputImg ? inputImg.value.trim() : "";
            const usuario = obterUsuarioLogado();
            
            if (!conteudo) {
                alert("Escreva algo para publicar!");
                return;
            }

            try {
                await apiCriarPost({ texto: conteudo, img: imagemUrl }, usuario.token);
                document.getElementById("conteudo-post").value = "";
                if (inputImg) inputImg.value = "";
                carregarFeed();
            } catch (err) {
                alert("Erro ao publicar: " + err.message);
            }
        });
    }

    const btnFeed = document.getElementById("nav-feed");
    const btnPerfil = document.getElementById("nav-perfil");
    
    if (btnFeed && btnPerfil) {
        btnFeed.addEventListener("click", (e) => {
            e.preventDefault();
            btnFeed.classList.add("active");
            btnPerfil.classList.remove("active");
            document.getElementById("feed-container-principal").style.display = "block";
            document.getElementById("profile-section").style.display = "none";
            carregarFeed();
        });

        btnPerfil.addEventListener("click", (e) => {
            e.preventDefault();
            btnPerfil.classList.add("active");
            btnFeed.classList.remove("active");
            document.getElementById("feed-container-principal").style.display = "none";
            document.getElementById("profile-section").style.display = "block";
            carregarPerfil();
        });
    }
}

// --- AUXILIAR YOUTUBE EMBED ---
function converterUrlYouTube(url) {
    if (!url) return "";
    if (url.includes("/embed/")) return url;

    let videoId = "";
    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1]?.split("&")[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// --- MODAL DE EDIÇÃO ---
let callbackEdicaoAtual = null;

function configurarModalEdicao() {
    const modal = document.getElementById("modal-edicao");
    const formModal = document.getElementById("form-edicao-modal");
    const btnCancelar = document.getElementById("modal-btn-cancelar");

    formModal.addEventListener("submit", (e) => {
        e.preventDefault();
        const novoTexto = document.getElementById("modal-input-texto").value.trim();
        if (callbackEdicaoAtual && novoTexto) {
            callbackEdicaoAtual(novoTexto);
        }
        modal.style.display = "none";
    });

    btnCancelar.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "none";
    });
}

function abrirModalEdicao(titulo, textoInicial, callback) {
    document.getElementById("modal-tituloinnerText", titulo);
    document.getElementById("modal-titulo").innerText = titulo;
    document.getElementById("modal-input-texto").value = textoInicial;
    callbackEdicaoAtual = callback;
    document.getElementById("modal-edicao").style.display = "flex";
}

// --- CARREGAR FEED PRINCIPAL ---
async function carregarFeed(filtroTag = null) {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    
    if (filtroTag) {
        timeline.innerHTML = `<p style="color: var(--arcade-cyan); margin-bottom: 10px;">🎮 Filtrando feed pelo tópico: #${filtroTag} <button id="btn-limpar-filtro" class="btn-topico" style="display:inline-block; font-size:7px; padding:3px; margin-left:10px;">Limpar Filtro</button></p>`;
        document.getElementById("btn-limpar-filtro").addEventListener("click", (e) => {
            e.preventDefault();
            carregarFeed();
        });
    } else {
        timeline.innerHTML = "<p>Carregando publicações...</p>";
    }

    try {
        const [posts, usuarios] = await Promise.all([apiBuscarPosts(), apiBuscarUsuarios()]);
        if (!filtroTag) timeline.innerHTML = "";
        
        const usuarioLogado = obterUsuarioLogado();
        const mapaUsuarios = {};
        usuarios.forEach(u => { mapaUsuarios[u.id] = u.nome; });

        let postsFiltrados = posts;
        if (filtroTag) {
            postsFiltrados = posts.filter(p => {
                const texto = p.texto || p.conteudo || "";
                return texto.toLowerCase().includes(`#${filtroTag.toLowerCase()}`);
            });
        }

        if (postsFiltrados.length === 0) {
            timeline.innerHTML += `<p style="color: var(--arcade-yellow);">Nenhuma publicação encontrada.</p>`;
            return;
        }

        for (const post of postsFiltrados) {
            let card = document.createElement("div");
            card.classList.add("post-card");
            
            const autorId = post.usuario !== undefined ? post.usuario : post.usuarioId;
            const nomeAutor = mapaUsuarios[autorId] || 'Usuário Desconhecido';

            const perfilFirebase = await obterPerfilFirebase(autorId);
            const avatarUrl = (perfilFirebase && perfilFirebase.img) ? perfilFirebase.img : 'https://via.placeholder.com/40';

            let botoesAcoesPost = "";
            if (usuarioLogado && autorId === usuarioLogado.id) {
                botoesAcoesPost = `
                    <div class="post-owner-actions">
                        <button class="btn-editar-post" data-id="${post.id}" data-texto="${encodeURIComponent(post.texto || post.conteudo || '')}">Editar</button>
                        <button class="btn-deletar-post" data-id="${post.id}">Excluir</button>
                    </div>
                `;
            }

            const textoPost = post.texto || post.conteudo || '';
            let midiaHTML = "";
            if (post.img && post.img.trim() !== "") {
                if (post.img.includes("youtube.com") || post.img.includes("youtu.be")) {
                    const urlEmbed = converterUrlYouTube(post.img);
                    midiaHTML = `<div class="post-media" style="margin-top: 10px;"><iframe width="100%" height="200" src="${urlEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                } else {
                    midiaHTML = `<div class="post-media" style="margin-top: 10px;"><img src="${post.img}" alt="Mídia" style="max-width: 100%; border-radius: 4px;"></div>`;
                }
            }

            card.innerHTML = `
                <div class="post-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${avatarUrl}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid var(--arcade-cyan); object-fit: cover;">
                        <strong>${nomeAutor}</strong>
                    </div>
                    ${botoesAcoesPost}
                </div>
                <p style="margin-top: 10px;">${textoPost}</p>
                ${midiaHTML}
                <div class="post-actions">
                    <button type="button" class="btn-like" data-id="${post.id}">❤️ Curtir (${post.likes ? post.likes.length : 0})</button>
                    <button type="button" class="btn-toggle-comentarios" data-id="${post.id}">💬 Comentários</button>
                </div>
                <div id="comentarios-container-${post.id}" style="margin-top: 10px; display: none; border-top: 1px dashed var(--arcade-border); padding-top: 10px;">
                    <div class="lista-comentarios" id="lista-comentarios-${post.id}">Carregando comentários...</div>
                    <form class="form-comentario" data-id="${post.id}" style="margin-top: 8px; display: flex; gap: 5px;">
                        <input type="text" class="input-comentario-texto" placeholder="Escreva um comentário..." required style="margin-bottom:0;">
                        <button type="submit" style="padding: 5px 10px; font-size:8px;">Enviar</button>
                    </form>
                </div>
            `;
            timeline.append(card);
        }
    } catch (err) {
        timeline.innerHTML = "<p>Erro ao carregar o feed.</p>";
        console.error(err);
    }
}

// --- DELEGAÇÃO DE EVENTOS NA TIMELINE (Substitui múltiplos listeners individuais) ---
function configurarDelegacaoEventosTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    timeline.addEventListener("click", async (e) => {
        // Previne qualquer comportamento padrão de navegação ou submit fantasma
        e.preventDefault(); 
        
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) return;

        const target = e.target;

        // Deletar Post
        if (target.classList.contains("btn-deletar-post")) {
            const idPost = target.getAttribute("data-id");
            if (confirm("Deseja realmente excluir este post?")) {
                try {
                    await apiDeletarPost(idPost, usuarioLogado.token);
                    carregarFeed();
                } catch (err) {
                    alert("Erro ao excluir: " + err.message);
                }
            }
        }

        // Editar Post
        if (target.classList.contains("btn-editar-post")) {
            const idPost = target.getAttribute("data-id");
            const textoAntigo = decodeURIComponent(target.getAttribute("data-texto"));

            abrirModalEdicao("EDITAR POST", textoAntigo, async (novoTexto) => {
                try {
                    await apiEditarPost(idPost, { texto: novoTexto, img: "" }, usuarioLogado.token);
                    carregarFeed();
                } catch (err) {
                    alert("Erro ao editar: " + err.message);
                }
            });
        }

        // Curtir Post (Atualiza instantaneamente sem recarregar a página inteira se preferir, ou chama o carregarFeed de forma assíncrona limpa)
        if (target.classList.contains("btn-like")) {
            const idPost = target.getAttribute("data-id");
            try {
                await apiToggleLike(idPost, usuarioLogado.token);
                carregarFeed(); // Executa em background sem refresh de página
            } catch (err) {
                alert("Erro ao curtir: " + err.message);
            }
        }

        // Toggle Comentários
        if (target.classList.contains("btn-toggle-comentarios")) {
            const idPost = target.getAttribute("data-id");
            const container = document.getElementById(`comentarios-container-${idPost}`);
            if (container) {
                if (container.style.display === "none") {
                    container.style.display = "block";
                    carregarListaComentarios(idPost);
                } else {
                    container.style.display = "none";
                }
            }
        }

        // Deletar Comentário
        if (target.classList.contains("btn-deletar-comentario")) {
            const idComentario = target.getAttribute("data-id");
            const postId = target.getAttribute("data-post");
            if (confirm("Excluir este comentário?")) {
                try {
                    await apiDeletarComentario(idComentario, usuarioLogado.token);
                    carregarListaComentarios(postId);
                } catch (err) {
                    alert("Erro ao deletar comentário: " + err.message);
                }
            }
        }

        // Editar Comentário
        if (target.classList.contains("btn-editar-comentario")) {
            const idComentario = target.getAttribute("data-id");
            const postId = target.getAttribute("data-post");
            const textoAntigo = decodeURIComponent(target.getAttribute("data-texto"));

            abrirModalEdicao("EDITAR COMENTÁRIO", textoAntigo, async (novoTexto) => {
                try {
                    await apiEditarComentario(idComentario, { texto: novoTexto }, usuarioLogado.token);
                    carregarListaComentarios(postId);
                } catch (err) {
                    alert("Erro ao editar comentário: " + err.message);
                }
            });
        }
    });

    // Envio de Comentário travando o submit para não atualizar a página
    timeline.addEventListener("submit", async (e) => {
        e.preventDefault(); // Impede o refresh padrão do formulário do navegador
        
        if (e.target.classList.contains("form-comentario")) {
            const usuarioLogado = obterUsuarioLogado();
            const idPost = e.target.getAttribute("data-id");
            const input = e.target.querySelector(".input-comentario-texto");
            const textoComentario = input.value.trim();

            if (!textoComentario) return;

            try {
                await apiCriarComentario(idPost, { texto: textoComentario }, usuarioLogado.token);
                input.value = "";
                carregarListaComentarios(idPost);
            } catch (err) {
                alert("Erro ao comentar: " + err.message);
            }
        }
    });
}

async function carregarListaComentarios(idPost) {
    const listaDiv = document.getElementById(`lista-comentarios-${idPost}`);
    if (!listaDiv) return;
    const usuarioLogado = obterUsuarioLogado();

    try {
        const [comentarios, usuarios] = await Promise.all([apiBuscarComentarios(idPost), apiBuscarUsuarios()]);
        const mapaUsuarios = {};
        usuarios.forEach(u => { mapaUsuarios[u.id] = u.nome; });

        if (comentarios.length === 0) {
            listaDiv.innerHTML = `<p style="font-size:12px; color: var(--arcade-yellow);">Nenhum comentário ainda.</p>`;
            return;
        }

        listaDiv.innerHTML = "";
        comentarios.forEach(c => {
            const autorId = c.usuario !== undefined ? c.usuario : c.usuarioId;
            const nomeAutor = mapaUsuarios[autorId] || 'Usuário';

            let botoesAcoesComentario = "";
            if (usuarioLogado && autorId === usuarioLogado.id) {
                botoesAcoesComentario = `
                    <div style="float: right; display: flex; gap: 5px;">
                        <button class="btn-editar-comentario" data-id="${c.id}" data-post="${idPost}" data-texto="${encodeURIComponent(c.texto)}" style="font-size: 6px; padding: 2px 5px;">Editar</button>
                        <button class="btn-deletar-comentario" data-id="${c.id}" data-post="${idPost}" style="font-size: 6px; padding: 2px 5px; background: #900;">X</button>
                    </div>
                `;
            }

            let item = document.createElement("div");
            item.style.cssText = "background: rgba(0,0,0,0.3); border-left: 2px solid var(--arcade-cyan); padding: 5px 8px; margin: 4px 0; font-size: 13px;";
            item.innerHTML = `
                ${botoesAcoesComentario}
                <strong>${nomeAutor}:</strong> ${c.texto}
            `;
            listaDiv.appendChild(item);
        });

    } catch (err) {
        listaDiv.innerHTML = `<p style="color: red; font-size: 12px;">Erro ao carregar comentários.</p>`;
        console.error(err);
    }
}

// --- PERFIL E ABAS ---
async function carregarPerfil() {
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado) return;

    document.getElementById("profile-name").innerText = usuarioLogado.nome;
    const avatarImg = document.getElementById("profile-avatar");

    const perfilFirebase = await obterPerfilFirebase(usuarioLogado.id);
    if (perfilFirebase && perfilFirebase.img) {
        avatarImg.src = perfilFirebase.img;
        usuarioLogado.img = perfilFirebase.img;
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
    } else if (usuarioLogado.img) {
        avatarImg.src = usuarioLogado.img;
    }

    const btnMudarFoto = document.getElementById("btn-mudar-foto");
    const novoBtnMudar = btnMudarFoto.cloneNode(true);
    btnMudarFoto.parentNode.replaceChild(novoBtnMudar, btnMudarFoto);

    document.getElementById("btn-mudar-foto").addEventListener("click", async (e) => {
        e.preventDefault();
        const novaUrl = prompt("Insira o link (URL) da nova imagem para o seu avatar:");
        if (novaUrl !== null && novaUrl.trim() !== "") {
            const urlLimpa = novaUrl.trim();
            try {
                await salvarPerfilFirebase(usuarioLogado.id, usuarioLogado.nome, urlLimpa);
                usuarioLogado.img = urlLimpa;
                localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
                avatarImg.src = urlLimpa;
                alert("Foto de perfil atualizada na nuvem com sucesso!");
            } catch (err) {
                alert("Erro ao atualizar foto: " + err);
            }
        }
    });

    document.querySelectorAll(".tab-perfil").forEach(btn => {
        const novoBtnTab = btn.cloneNode(true);
        btn.parentNode.replaceChild(novoBtnTab, btn);

        novoBtnTab.addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelectorAll(".tab-perfil").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            renderizarConteudoPerfil(e.target.getAttribute("data-tab"));
        });
    });

    renderizarConteudoPerfil("meus-posts");
}

function renderizarConteudoPerfil(aba) {
    const areaConteudo = document.getElementById("profile-content-area");
    const usuarioLogado = obterUsuarioLogado();

    if (aba === "topicos") {
        let topicosSalvos = JSON.parse(localStorage.getItem(`topicos_${usuarioLogado.id}`)) || ["StreetFighter", "RetroGaming", "Arcade"];

        areaConteudo.innerHTML = `
            <div style="padding: 10px;">
                <h3>TÓPICOS DE INTERESSE SEGUIDOS</h3>
                <p>Clique em um tópico para filtrar o feed instantaneamente:</p>
                <div id="lista-topicos-seguidos" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;"></div>
                <div style="margin-top: 20px;">
                    <input type="text" id="input-novo-topico" placeholder="Adicionar nova hashtag (ex: Tekken)" style="width: 70%; display:inline-block;">
                    <button id="btn-adicionar-topico" style="width: 25%; display:inline-block; padding: 11px;">Seguir</button>
                </div>
            </div>
        `;

        const renderizarBotoesTopicos = () => {
            const container = document.getElementById("lista-topicos-seguidos");
            container.innerHTML = "";
            topicosSalvos.forEach(tag => {
                const btnTag = document.createElement("button");
                btnTag.className = "btn-topico";
                btnTag.innerHTML = `#${tag} ❌`;
                
                btnTag.addEventListener("click", (ev) => {
                    ev.preventDefault();
                    document.getElementById("nav-feed").click();
                    carregarFeed(tag);
                });
                container.appendChild(btnTag);
            });
        };

        renderizarBotoesTopicos();

        document.getElementById("btn-adicionar-topico").addEventListener("click", (e) => {
            e.preventDefault();
            const novoTopicoInput = document.getElementById("input-novo-topico");
            let novaTag = novoTopicoInput.value.trim().replace(/^#/, "");
            if (novaTag && !topicosSalvos.includes(novaTag)) {
                topicosSalvos.push(novaTag);
                localStorage.setItem(`topicos_${usuarioLogado.id}`, JSON.stringify(topicosSalvos));
                novoTopicoInput.value = "";
                renderizarBotoesTopicos();
            }
        });
        return;
    }

    areaConteudo.innerHTML = "<p>Carregando dados...</p>";

    Promise.all([apiBuscarPosts(), apiBuscarUsuarios()])
        .then(([posts, usuarios]) => {
            areaConteudo.innerHTML = "";
            const mapaUsuarios = {};
            usuarios.forEach(u => { mapaUsuarios[u.id] = u.nome; });

            let postsFiltrados = [];

            if (aba === "meus-posts") {
                postsFiltrados = posts.filter(p => {
                    const autorId = p.usuario !== undefined ? p.usuario : p.usuarioId;
                    return autorId === usuarioLogado.id;
                });
            } else if (aba === "curtidos") {
                postsFiltrados = posts.filter(p => {
                    if (!p.likes) return false;
                    return p.likes.some(l => (l.usuario === usuarioLogado.id || l === usuarioLogado.id));
                });
            }

            if (postsFiltrados.length === 0) {
                areaConteudo.innerHTML = `<p style="padding: 10px; color: var(--arcade-yellow);">Nenhum post encontrado nesta seção.</p>`;
                return;
            }

            postsFiltrados.forEach(post => {
                let card = document.createElement("div");
                card.classList.add("post-card");
                const textoPost = post.texto || post.conteudo || '';
                const autorId = post.usuario !== undefined ? post.usuario : post.usuarioId;
                
                let midiaHTML = "";
                if (post.img && post.img.trim() !== "") {
                    if (post.img.includes("youtube.com") || post.img.includes("youtu.be")) {
                        const urlEmbed = converterUrlYouTube(post.img);
                        midiaHTML = `<div class="post-media" style="margin-top: 10px;"><iframe width="100%" height="180" src="${urlEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                    } else {
                        midiaHTML = `<div class="post-media" style="margin-top: 10px;"><img src="${post.img}" alt="Mídia" style="max-width: 100%; border-radius: 4px;"></div>`;
                    }
                }

                card.innerHTML = `
                    <div class="post-header"><strong>${mapaUsuarios[autorId] || 'Usuário'}</strong></div>
                    <p style="margin-top: 10px;">${textoPost}</p>
                    ${midiaHTML}
                `;
                areaConteudo.append(card);
            });
        })
        .catch(err => {
            areaConteudo.innerHTML = "<p>Erro ao carregar conteúdo do perfil.</p>"; //create element
            console.error(err);
        });
}