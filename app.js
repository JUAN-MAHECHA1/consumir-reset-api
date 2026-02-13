// Referencias a los elementos del DOM
const imageEl = document.getElementById('pokemon-image');
const nameEl = document.getElementById('pokemon-name');
const typesEl = document.getElementById('pokemon-types');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const randomBtn = document.getElementById('random');
const idEl = document.getElementById('pokemon-id');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Estado actual: id del Pokémon mostrado
let currentId = 1;

// MAX_POKEMON se establece dinámicamente al inicializar la app
let MAX_POKEMON = 1010;

let isReady = false; // indica si la app ya obtuvo el total

/**
 * fetchPokemon(id)
 * - Realiza una petición a la PokeAPI para obtener los datos del Pokémon con el id o nombre dado.
 * - Actualiza la UI y maneja errores básicos.
 */
async function fetchPokemon(id){
  // mostrar estado de carga
  nameEl.textContent = 'Cargando...';
  typesEl.textContent = '';
  imageEl.src = '';
  try{
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if(!res.ok) throw new Error('No encontrado');
    const data = await res.json();
    // animación: primero ocultar, luego actualizar
    await animateTransition(() => updateUI(data));
  }catch(err){
    // Si hay error (404 u otro), mostrar fallback
    nameEl.textContent = 'No encontrado';
    typesEl.textContent = '';
    imageEl.alt = 'No disponible';
    imageEl.src = '';
    console.error(err);
  }
}

/**
 * updateUI(data)
 * - Usa los datos devueltos por la API para pintar la interfaz.
 */
function updateUI(data){
  const displayName = data.name || '—';
  const types = (data.types || []).map(t => t.type.name).join(', ');
  // Preferir la ilustración oficial; si no existe, usar front_default
  const sprite = data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '';

  nameEl.textContent = displayName;
  typesEl.textContent = types ? `Tipo: ${types}` : 'Tipo: —';
  imageEl.src = sprite || '';
  imageEl.alt = `Imagen de ${displayName}`;
  idEl.textContent = `#${data.id}`;
  
  // establecer fondo dinámico con la imagen del Pokémon
  if(sprite){
    document.body.style.backgroundImage = `url('${sprite}')`;
  }
  
  // actualizar estado de botones
  // cuando se busca por nombre, data.id nos da el id numérico
  currentId = data.id || currentId;
  prevBtn.disabled = currentId <= 1;
  nextBtn.disabled = currentId >= MAX_POKEMON;
}

// Eventos de los botones
prevBtn.addEventListener('click', ()=>{
  if(currentId <= 1) return;
  currentId -= 1;
  fetchPokemon(currentId);
});

nextBtn.addEventListener('click', ()=>{
  if(currentId >= MAX_POKEMON) return;
  currentId += 1;
  fetchPokemon(currentId);
});

// Botón Aleatorio: genera un id aleatorio entre 1 y MAX_POKEMON
randomBtn.addEventListener('click', ()=>{
  const rand = Math.floor(Math.random() * MAX_POKEMON) + 1;
  currentId = rand;
  fetchPokemon(currentId);
});

// Búsqueda por nombre o id
searchBtn.addEventListener('click', ()=>{
  const q = searchInput.value.trim();
  if(!q) return;
  // si es número, convertir a entero; si no, usar nombre en minúsculas
  const candidate = /^[0-9]+$/.test(q) ? parseInt(q,10) : q.toLowerCase();
  fetchPokemon(candidate);
});

// Soporte para Enter en el input
searchInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') searchBtn.click();
});

/**
 * Animate transition: aplica clases de fade a los elementos, ejecuta la actualización y hace fade-in.
 * callback puede ser sincrónico o asincrónico.
 */
function animateTransition(callback){
  return new Promise(async (resolve)=>{
    // elementos a animar
    const elements = [imageEl, nameEl, typesEl, idEl];
    elements.forEach(el => el.classList.remove('fade-in'));
    elements.forEach(el => el.classList.add('fade-out'));

    // esperar a la transición (coincide con CSS .fade-out .18s)
    setTimeout(async ()=>{
      try{
        await callback();
      }catch(e){console.error(e)}
      elements.forEach(el => el.classList.remove('fade-out'));
      elements.forEach(el => el.classList.add('fade-in'));
      resolve();
    }, 180);
  });
}

// obtener conteo total dinámicamente e inicializar
async function init(){
  try{
    // deshabilitar controls mientras se obtiene el total
    prevBtn.disabled = nextBtn.disabled = randomBtn.disabled = searchBtn.disabled = true;
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
    if(res.ok){
      const d = await res.json();
      if(d.count) MAX_POKEMON = d.count;
    }
  }catch(e){
    console.warn('No se pudo obtener el total dinámico, se usa el valor por defecto.');
  }finally{
    isReady = true;
    prevBtn.disabled = currentId <= 1;
    nextBtn.disabled = currentId >= MAX_POKEMON;
    randomBtn.disabled = false;
    searchBtn.disabled = false;
    // cargar inicialmente
    fetchPokemon(currentId);
  }
}

init();

// carga inicial
fetchPokemon(currentId);
