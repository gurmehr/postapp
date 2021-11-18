const html = Posts => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Posts</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css" rel="stylesheet"></link>
  </head>
  <body class="bg-blue-100">
    <div class="w-full h-full flex content-center justify-center mt-8">
      <div class="bg-white shadow-md rounded px-8 pt-6 py-8 mb-4">
        <h1 class="block text-grey-800 text-md font-bold mb-2">Posts</h1>
        <div class="flex">
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-800 leading-tight focus:outline-none focus:shadow-outline" type="text" name="title" placeholder="Title"></input>
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-800 leading-tight focus:outline-none focus:shadow-outline" type="text" name="name" placeholder="New Post"></input>
          <button class="bg-blue-500 hover:bg-blue-800 text-white font-bold ml-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline" id="create" type="submit">Post</button>
        </div>
        <div class="mt-4" id="Posts"></div>
      </div>
    </div>
  </body>
  <script>
    window.Posts = ${Posts}
    var updatePosts = function() {
      fetch("/", { method: 'PUT', body: JSON.stringify({ Posts: window.Posts }) })
      populatePosts()
    }
    var completePost = function(evt) {
      var checkbox = evt.target
      var PostElement = checkbox.parentNode
      var newPostsSet = [].concat(window.Posts)
      var Post = newPostsSet.find(t => t.id == PostElement.dataset.Post)
      Post.completed = !Post.completed
      window.Posts = newPostsSet
      updatePosts()
    }
    var populatePosts = function() {
      var PostContainer = document.querySelector("#Posts")
      PostContainer.innerHTML = null
      window.Posts.forEach(Post => {
        var el = document.createElement("div")
        el.className = "border-t py-4"
        el.dataset.Post = Post.id
        var name = document.createElement("span")
        name.className = Post.completed ? "line-through" : ""
        name.textContent = Post.title + " : " + Post.name
        el.appendChild(name)
        PostContainer.appendChild(el)
      })
    }
    populatePosts()
    var createPost = function() {
      var input = document.querySelector("input[name=name]")
      var title = document.querySelector("input[name=title]")
      if (input.value.length) {
        window.Posts = [].concat(Posts, { id: window.Posts.length + 1, name: input.value, title: title.value })
        input.value = ""
        title.value = ""
        updatePosts()
      }
    }
    document.querySelector("#create").addEventListener('click', createPost)
  </script>
</html>
`

const defaultData = { Posts: [] }

const setCache = (key, data) => mykvnamespace.put(key, data)
const getCache = key => mykvnamespace.get(key)

async function getPosts(request) {
  const ip = request.headers.get('CF-Connecting-IP')
  const cacheKey = `data-${ip}`
  let data
  const cache = await getCache(cacheKey)
  if (!cache) {
    await setCache(cacheKey, JSON.stringify(defaultData))
    data = defaultData
  } else {
    data = JSON.parse(cache)
  }
  const body = html(JSON.stringify(data.Posts || []).replace(/</g, "\\u003c"))
  return new Response(body, {
    headers: { 'Content-Type': 'text/html' },
  })
}

async function updatePosts(request) {
  const body = await request.text()
  const ip = request.headers.get('CF-Connecting-IP')
  const cacheKey = `data-${ip}`
  try {
    JSON.parse(body)
    await setCache(cacheKey, body)
    return new Response(body, { status: 200 })
  } catch (err) {
    return new Response(err, { status: 500 })
  }
}

async function handleRequest(request) {
  if (request.method === 'PUT') {
    return updatePosts(request)
  } else {
    return getPosts(request)
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})