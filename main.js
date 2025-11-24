// main.js

const loginForm = document.getElementById('adminLogin');
const dashboard = document.getElementById('dashboard');
const queueList = document.getElementById('queueList');
const logoutBtn = document.getElementById('logoutBtn');

auth.onAuthStateChanged(user => {
  if (user && user.email === 'projectwhoo@gmail.com') {
    dashboard.style.display = 'block';
    loginForm.parentElement.style.display = 'none';
    loadQueue();
  } else {
    dashboard.style.display = 'none';
    loginForm.parentElement.style.display = 'block';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch(err) {
    alert('Login failed: ' + err.message);
    console.error(err);
  }
});

logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

async function loadQueue() {
  queueList.innerHTML = '';
  try {
    const snapshot = await db.collection('queue')
      .where('createdAt', '!=', null)
      .orderBy('createdAt')
      .get();

    if (snapshot.empty) {
      queueList.innerHTML = '<li>No clients in queue</li>';
      return;
    }

    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement('li');
      li.textContent = '${d.name} - ${d.service} - ${d.status};
      queueList.appendChild(li);
    });

  } catch(err) {
    console.error('Error loading queue:', err);
    queueList.innerHTML = '<li>Error loading queue</li>';
  }
}
