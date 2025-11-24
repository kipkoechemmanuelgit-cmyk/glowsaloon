// main.js

const loginForm = document.getElementById('adminLogin');
const dashboard = document.getElementById('dashboard');
const queueList = document.getElementById('queueList');
const logoutBtn = document.getElementById('logoutBtn');

// Auth state
auth.onAuthStateChanged(user => {
  if(user && user.email === 'projectwhoo@gmail.com') {
    dashboard.style.display = 'block';
    loginForm.parentElement.style.display = 'none';
    loadQueue();
  } else {
    dashboard.style.display = 'none';
    loginForm.parentElement.style.display = 'block';
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch(err) {
    alert('Login failed: '+err.message);
  }
});

// Logout
logoutBtn.addEventListener('click', () => auth.signOut());

// Load queue
function loadQueue() {
  db.collection('queue')
    .orderBy('createdAt')
    .onSnapshot(snapshot => {
      queueList.innerHTML = '';
      if(snapshot.empty) {
        queueList.innerHTML = '<li>No clients in queue</li>';
        return;
      }
      snapshot.forEach(doc => {
        const d = doc.data();
        const li = document.createElement('li');
        li.textContent = `${d.name} - ${d.service} - ${d.status}`;
        // Optional: mark complete
        const btn = document.createElement('button');
        btn.textContent = 'Complete';
        btn.style.marginLeft = '10px';
        btn.onclick = () => db.collection('queue').doc(doc.id).update({status:'completed'});
        li.appendChild(btn);
        queueList.appendChild(li);
      });
    });
}
