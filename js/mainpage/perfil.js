import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Salvar ou atualizar dados do perfil no Firestore
export async function salvarPerfilFirebase(idUsuario, nome, imgUrl) {
    try {
        await setDoc(doc(db, "perfis", String(idUsuario)), {
            nome: nome,
            img: imgUrl,
            updatedAt: new Date()
        }, { merge: true });
        return true;
    } catch (err) {
        console.error("Erro ao salvar perfil no Firebase:", err);
        return Promise.reject("Erro ao salvar perfil na nuvem.");
    }
}

// Obter Perfil de Qualquer Usuário (Para o Feed e Comentários)
export async function obterPerfilFirebase(idUsuario) {
    try {
        const docRef = doc(db, "perfis", String(idUsuario));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (err) {
        console.error("Erro ao buscar perfil do Firebase:", err);
        return null;
    }
}