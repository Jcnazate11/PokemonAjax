let currentPage = 1;
const limit = 2; // Número máximo de Pokémon por página
let currentSearch = '';

document.getElementById('search-button').addEventListener('click', () => {
    currentSearch = document.getElementById('search').value.toLowerCase();
    currentPage = 1;
    fetchPokemonList(currentPage, currentSearch);
});

document.getElementById('prev-button').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchPokemonList(currentPage, currentSearch);
    }
});

document.getElementById('next-button').addEventListener('click', () => {
    currentPage++;
    fetchPokemonList(currentPage, currentSearch);
});

document.getElementById('clear-button').addEventListener('click', clearResults);

function clearResults() {
    document.getElementById('pokemon').innerHTML = '';
    document.getElementById('pokemon-list').innerHTML = '';
    document.getElementById('search').value = '';
    currentPage = 1;
    currentSearch = '';
    updatePagination(0);
}




function fetchPokemonList(page, search, typeFilter, pokedexFilter) {
    const offset = (page - 1) * limit;
    let url;

    if (typeFilter) {
        url = `https://pokeapi.co/api/v2/type/${typeFilter}?offset=${offset}&limit=${limit}`;
    } else if (pokedexFilter) {
        url = `https://pokeapi.co/api/v2/pokedex/${pokedexFilter}`;
    } else {
        url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
    }

    if (search) {
        url += `&name=${search}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let filteredPokemonList = [];

            if (typeFilter) {
                filteredPokemonList = data.pokemon.map(pokemon => pokemon.pokemon).filter(pokemon => pokemon.name.includes(search));
            } else if (pokedexFilter) {
                filteredPokemonList = data.pokemon_entries.map(entry => {
                    const pokemonUrl = entry.pokemon_species.url.replace('pokemon-species', 'pokemon');
                    return {
                        name: entry.pokemon_species.name,
                        url: pokemonUrl
                    };
                }).filter(pokemon => pokemon.name.includes(search));
            } else {
                filteredPokemonList = data.results.filter(pokemon => pokemon.name.includes(search));
            }

            displayPokemonList(filteredPokemonList);
            fetchTotalCount(search, typeFilter, pokedexFilter)
                .then(totalCount => {
                    updatePagination(totalCount);
                })
                .catch(error => console.error(error));
        })
        .catch(error => {
            console.error(error);
            document.getElementById('pokemon-list').innerHTML = `<p>Error al buscar Pokémon.</p>`;
        });
}

function fetchTotalCount(search, typeFilter, pokedexFilter) {
    let url;

    if (typeFilter) {
        url = `https://pokeapi.co/api/v2/type/${typeFilter}?limit=100000`;
    } else if (pokedexFilter) {
        url = `https://pokeapi.co/api/v2/pokedex/${pokedexFilter}`;
    } else {
        url = 'https://pokeapi.co/api/v2/pokemon?limit=100000';
    }

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Datos recibidos:', data);
            let filteredResults;
            if (typeFilter) {
                filteredResults = data.pokemon.map(pokemon => pokemon.pokemon).filter(pokemon => pokemon.name.includes(search));
            } else if (pokedexFilter) {
                filteredResults = data.pokemon_entries.map(entry => entry.pokemon_species).filter(pokemon => pokemon.name.includes(search));
            } else {
                filteredResults = data.results.filter(pokemon => pokemon.name.includes(search));
            }
            return filteredResults.length;
        });
}
function updatePagination(totalCount) {
    const totalPages = Math.ceil(totalCount / limit);
    document.getElementById('page-number').textContent = currentPage;
    document.getElementById('prev-button').disabled = currentPage === 1;
    document.getElementById('next-button').disabled = currentPage === totalPages;
}
function displayPokemonList(pokemonList) {
    const pokemonContainer = document.getElementById('pokemon-list');
    pokemonContainer.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const pokemonElement = document.createElement('div');
        pokemonElement.classList.add('pokemon');
        pokemonElement.innerHTML = `
            <h2>${pokemon.name}</h2>
            <p>Cargando...</p>
        `;
        pokemonContainer.appendChild(pokemonElement);
        console.log('URL del Pokémon:', pokemon.url);

        fetch(pokemon.url)
            .then(response => response.json())
            .then(data => {
                pokemonElement.innerHTML = `
                    <h2>${data.name}</h2>
                    <img src="${data.sprites.front_default}" alt="${data.name}">
                    <p>Altura: ${data.height / 10} m</p>
                    <p>Peso: ${data.weight / 10} kg</p>
                `;
            })
            .catch(error => {
                console.error(error);
                pokemonElement.innerHTML = `
                    <h2>${pokemon.name}</h2>
                    <p>Error al cargar los detalles del Pokémon.</p>
                `;
            });
    });
}

document.getElementById('search-button').addEventListener('click', () => {
    const search = document.getElementById('search').value;
    fetch(`https://pokeapi.co/api/v2/pokemon/${search}`)
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`El Pokémon "${search}" no existe.`);
        }
    })
        .then(data => {
            // Si se encuentra un resultado único, mostrarlo y detener la búsqueda paginada
            const pokemon = document.getElementById('pokemon');
            pokemon.innerHTML = `
                <h2>${data.name}</h2>
                <img src="${data.sprites.front_default}" alt="${data.name}">
                <p>Altura: ${data.height}</p>
                <p>Peso: ${data.weight}</p>
            `;
            // Limpiar la lista de Pokémon y la paginación
            document.getElementById('pokemon-list').innerHTML = '';
            document.getElementById('prev-button').disabled = true;
            document.getElementById('next-button').disabled = true;
        })
        .catch(error => {
            console.error(error);
            document.getElementById('pokemon').innerHTML = `<p>${error.message}</p>`;
            document.getElementById('pokemon-list').innerHTML = '';
            document.getElementById('prev-button').disabled = true;
            document.getElementById('next-button').disabled = true;
        });
});



function populateTypeFilter() {
    const typeFilter = document.getElementById('type-filter');
    fetch('https://pokeapi.co/api/v2/type')
        .then(response => response.json())
        .then(data => {
            data.results.forEach(type => {
                const option = document.createElement('option');
                option.value = type.name;
                option.textContent = type.name;
                typeFilter.appendChild(option);
            });
        })
        .catch(error => console.error(error));
}

populateTypeFilter();

const typeFilter = document.getElementById('type-filter');
typeFilter.addEventListener('change', () => {
    const selectedType = typeFilter.value;
    currentPage = 1; // Reiniciar la página actual
    fetchPokemonList(currentPage, currentSearch, selectedType, null);
});

function populatePokedexFilter() {
    const pokedexFilter = document.getElementById('pokedex-filter');
    fetch('https://pokeapi.co/api/v2/pokedex')
        .then(response => response.json())
        .then(data => {
            data.results.forEach(pokedex => {
                const option = document.createElement('option');
                option.value = pokedex.name;
                option.textContent = pokedex.name;
                pokedexFilter.appendChild(option);
            });
        })
        .catch(error => console.error(error));
}
populateTypeFilter();
populatePokedexFilter();

const pokedexFilter = document.getElementById('pokedex-filter');
pokedexFilter.addEventListener('change', () => {
    const selectedPokedex = pokedexFilter.value;
    console.log('Pokédex seleccionada:', selectedPokedex);
    currentPage = 1;
    fetchPokemonList(currentPage, currentSearch, null, selectedPokedex);
});