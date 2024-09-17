import io from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

export default {
    template: `
      <div class="container mt-5 box p-4">
        <h2>Your Todo List</h2>
        <button class="btn btn-primary mb-3" @click="showAddForm = true">Add Todo</button>

        <div v-if="showAddForm" class="mb-3">
          <h3>Add Todo</h3>
          <form @submit="addTodo">
            <div class="mb-3">
              <label for="title" class="form-label">Title</label>
              <input type="text" class="form-control" id="title" v-model="newTodo.title" required>
            </div>
            <div class="mb-3">
              <label for="description" class="form-label">Description</label>
              <textarea class="form-control" id="description" v-model="newTodo.description" required></textarea>
            </div>
            <div class="form-check mb-3">
              <input type="checkbox" class="form-check-input" id="complete" v-model="newTodo.complete">
              <label class="form-check-label" for="complete">Complete</label>
            </div>
            <button type="submit" class="btn btn-primary">Add Todo</button>
            <button type="button" class="btn btn-secondary" @click="showAddForm = false">Cancel</button>
          </form>
        </div>

        <ul class="list-group">
          <li v-for="todo in todos" :key="todo._id" class="list-group-item">
            <input type="checkbox" :checked="todo.complete" @change="toggleComplete(todo)">
            <!-- Checkbox for completeness -->
            <strong>{{ todo.title }}</strong>: {{ todo.description }}
            <button class="btn btn-sm btn-warning float-end" @click="editTodoForm(todo)">Edit</button>
            <button class="btn btn-sm btn-danger float-end me-2" @click="deleteTodo(todo)">Delete</button>
          </li>
        </ul>

        <div v-if="editFormVisible" class="mt-5">
          <h3>Edit Todo</h3>
          <form @submit="updateTodo">
            <div class="mb-3">
              <label for="edit-title" class="form-label">Title</label>
              <input type="text" class="form-control" id="edit-title" v-model="editTodo.title" required>
            </div>
            <div class="mb-3">
              <label for="edit-description" class="form-label">Description</label>
              <textarea class="form-control" id="edit-description" v-model="editTodo.description" required></textarea>
            </div>
            <div class="form-check mb-3">
              <input type="checkbox" class="form-check-input" id="edit-complete" v-model="editTodo.complete">
              <label class="form-check-label" for="edit-complete">Complete</label>
            </div>
            <button type="submit" class="btn btn-primary">Update Todo</button>
            <button type="button" class="btn btn-secondary" @click="editFormVisible = false">Cancel</button>
          </form>
        </div>
      </div>

    `,

    data() {
        return {

            todos: [],
            newTodo: {title: '', description: '', complete: false},
            editTodo: {title: '', description: '', complete: false},
            showAddForm: false,
            editFormVisible: false,
        };
    },

    methods: {
        async getTodos() {
            try {
                const response = await axios.get('/todos');
                this.todos = response.data;
            } catch (error) {
                console.error(error);
            }
        },

        async addTodo() {
            try {
                const response = await axios.post('/todos', this.newTodo);
                this.todos.push(response.data);
                this.newTodo = {title: '', description: '', complete: false};
                this.showAddForm = false;
            } catch (error) {
                console.error(error);
            }
        },

        async deleteTodo(todo) {
            try {
                await axios.delete(`/todos/${todo._id}`);
                this.todos = this.todos.filter(t => t._id !== todo._id);
            } catch (error) {
                console.error(error);
            }
        },

        editTodoForm(todo) {
            this.editTodo = {...todo};
            this.editFormVisible = true;
        },

        async updateTodo() {
            try {
                const response = await axios.put(`/todos/${this.editTodo._id}`, this.editTodo);
                const index = this.todos.findIndex(t => t._id === this.editTodo._id);
                this.todos[index] = response.data;
                this.editFormVisible = false;
            } catch (error) {
                console.error(error);
            }
        },

        async toggleComplete(todo) {
            todo.complete = !todo.complete;
            try {
                await axios.put(`/todos/${todo._id}`, todo);
            } catch (error) {
                console.error(error);
            }
        },
    },

    async created() {
        await this.getTodos();
    }
};

