document.getElementById('logout').addEventListener('click', function() {
    window.location.href = '/';
});

document.getElementById('create-post').addEventListener('click', function() {
    document.getElementById('post-modal').style.display = 'block';
});

document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('post-modal').style.display = 'none';
});

document.getElementById('post-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    fetch('/create-post', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(result => {
        alert(result);
        document.getElementById('post-modal').style.display = 'none';
        loadPosts('/posts');
    })
    .catch(error => console.error('Error:', error));
});

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
document.getElementById('author').value = username;

document.getElementById('my-posts').addEventListener('click', function() {
    loadPosts(`/my-posts?username=${username}`);
});

document.getElementById('all-posts').addEventListener('click', function() {
    loadPosts('/posts');
});

function loadPosts(url) {
    fetch(url)
        .then(response => response.json())
        .then(posts => {
            const container = document.getElementById('posts-container');
            container.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                    <p><strong>Автор:</strong> ${post.author}</p>
                    <p><strong>Стоимость путешествия:</strong> ${post.cost} ${post.currency}</p>
                    <p><strong>Удобство:</strong> ${getStars(post.convenience)}</p>
                    <p><strong>Безопасность:</strong> ${getStars(post.safety)}</p>
                    <p><strong>Населённость:</strong> ${getStars(post.population)}</p>
                    <p><strong>Растительность:</strong> ${getStars(post.vegetation)}</p>
                    ${post.images.length ? `
                    <div class="slider">
                        ${post.images.map((image, index) => `<img src="${image}" class="${index === 0 ? 'active' : ''}">`).join('')}
                        <a class="prev">&#10094;</a>
                        <a class="next">&#10095;</a>
                    </div>` : ''}
                `;
                container.appendChild(postElement);

                if (post.images.length) {
                    const slider = postElement.querySelector('.slider');
                    const images = slider.querySelectorAll('img');
                    let currentIndex = 0;

                    slider.querySelector('.prev').addEventListener('click', () => {
                        images[currentIndex].classList.remove('active');
                        currentIndex = (currentIndex - 1 + images.length) % images.length;
                        images[currentIndex].classList.add('active');
                    });

                    slider.querySelector('.next').addEventListener('click', () => {
                        images[currentIndex].classList.remove('active');
                        currentIndex = (currentIndex + 1) % images.length;
                        images[currentIndex].classList.add('active');
                    });
                }
            });
        })
        .catch(error => console.error('Error:', error));
}

function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Load all posts by default
loadPosts('/posts');
