// Agenda Pastoral — configuração do Firebase (base compartilhada).
// Enquanto AGP_FIREBASE for null, a agenda funciona só no aparelho (modo local).
// Para ativar: cole aqui o objeto firebaseConfig do console do Firebase e o e-mail do coordenador.
window.AGP_FIREBASE = null;
/* exemplo:
window.AGP_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "agenda-pastoral-xxxx.firebaseapp.com",
  projectId: "agenda-pastoral-xxxx",
  storageBucket: "agenda-pastoral-xxxx.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abc123"
};
*/
window.AGP_DONO = ""; // e-mail Google do coordenador (o mesmo das regras)
