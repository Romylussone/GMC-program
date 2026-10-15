
export const get = (req, res) => {
  res.send('Get all todos');
}

export const getById = (req, res) => {
  const id = req.params.id;
  res.send(`Get todo with ID: ${id}`);
}

export const post = (req, res) => {
  res.send('Create a new todo');
}