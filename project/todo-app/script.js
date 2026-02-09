const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') return;

    const li = document.createElement('li');
    li.innerHTML = `
            <span>${text}</span>
            <div>            
                <button class="done-btn">Done</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

    li.querySelector('span').addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
        li.remove();
    });

    todoList.appendChild(li);
    todoInput.value = '';
    todoInput.focus();
}