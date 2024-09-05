// Configurazione API di OpenAI
const OPENAI_API_KEY = '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'; // Sostituisci con la tua chiave API
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

let selectedCaption = ''; // Variabile per memorizzare la caption selezionata
let selectedStyle = ''; // Variabile per memorizzare lo stile selezionato
let stylePrompts = {}; // Oggetto per memorizzare i prompt relativi ai pulsanti

console.log('Inizializzazione variabili globali completata');

// Caricamento del file JSON con i dati dei pulsanti
fetch('styles.json')
    .then(response => response.json())
    .then(data => {
        console.log('Dati JSON caricati:', data);
        const styleButtonsContainer = document.getElementById('styleButtons');
        data.buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'style-button';
            btn.dataset.style = button.text.toLowerCase();
            btn.textContent = button.text;
            stylePrompts[button.text.toLowerCase()] = button.prompt;

            // Crea un div per mostrare il messaggio di errore
            const errorMessage = document.createElement('div');
            errorMessage.style.color = 'red';
            errorMessage.style.display = 'none'; // Nasconde il messaggio all'inizio
            errorMessage.textContent = 'Carica un\'immagine prima di scegliere lo stile.';
            document.body.appendChild(errorMessage);

            btn.addEventListener('click', function() {
                // Verifica se un'immagine è stata caricata
                if (document.getElementById('imageUpload').files.length === 0) {
                    // Mostra il messaggio di errore
                    errorMessage.style.display = 'block';
                    
                    // Nasconde il messaggio dopo 3 secondi
                    setTimeout(() => {
                        errorMessage.style.display = 'none';
                    }, 3000);
                    
                    return; // Esci dalla funzione se non c'è un'immagine caricata
                }

                // Nasconde il messaggio di errore se presente
                errorMessage.style.display = 'none';

                // Logica per la selezione dello stile
                console.log('Pulsante selezionato:', button.text.toLowerCase());
                document.querySelectorAll('.style-button').forEach(b => {
                    b.classList.remove('selected');
                    b.style.backgroundColor = ''; // Ripristina il colore originale
                });

                // Aggiunge la classe 'selected' al pulsante cliccato e cambia il colore
                this.classList.add('selected');
                this.style.backgroundColor = '#81c784'; // Verde chiaro per il pulsante selezionato

                selectedStyle = button.text.toLowerCase();
                console.log('Stile selezionato:', selectedStyle);

                // Abilita il pulsante "Genera Caption" se un'immagine è stata caricata
                document.getElementById('generateBtn').style.backgroundColor = '#28a745';
            });

            styleButtonsContainer.appendChild(btn);
        });
    })
    .catch(error => console.error('Errore nel caricamento del file JSON:', error));

// Funzione per caricare l'immagine e ottenere un URL base64
async function encodeImage(imageFile) {
    console.log('Inizio codifica immagine in base64');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            console.log('Immagine caricata e codificata in base64:', reader.result);
            resolve(reader.result.split(',')[1]); // Ottieni solo il base64
        };
        reader.onerror = (error) => {
            console.error('Errore nella codifica dell\'immagine:', error);
            reject(error);
        };
        reader.readAsDataURL(imageFile);
    });
}

// Funzione per generare una caption utilizzando OpenAI API
async function generateCaptionWithAI(imageBase64, style) {
    const prompt = stylePrompts[style];

    console.log('Prompt inviato all\'API:', prompt);

    const requestBody = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    { "type": "text", "text": prompt },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": `data:image/jpeg;base64,${imageBase64}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 150
    };

    console.log('Richiesta API:', JSON.stringify(requestBody));

    const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        console.error('Errore nella risposta dell\'API:', response.statusText);
        throw new Error(`Errore nell'API OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Risposta dell\'API:', data);
    return data.choices[0].message.content.trim();
}

// Evento per la generazione delle caption
document.getElementById('generateBtn').addEventListener('click', async () => {
    console.log('Pulsante "Genera Caption con AI" cliccato');
    try {
        const fileInput = document.getElementById('imageUpload');
        const imageFile = fileInput.files[0];

        if (!imageFile) {
            alert('Seleziona un\'immagine prima di generare le caption.');
            console.warn('Nessuna immagine selezionata');
            return;
        }

        if (!selectedStyle) {
            alert('Seleziona uno stile di scrittura prima di generare le caption.');
            console.warn('Nessuno stile selezionato');
            return;
        }

        const imageBase64 = await encodeImage(imageFile); // Codifica l'immagine in base64

        const captionContainer = document.getElementById('captionContainer');
        captionContainer.innerHTML = ''; // Pulisce i risultati precedenti

        // Imposta testo provvisorio "in attesa dell'output..." con effetto lampeggiante
        const loadingText = "in attesa dell'output...";
        const captionBox1 = document.createElement('div');
        captionBox1.className = 'caption-box';
        captionBox1.innerHTML = `
    <span class="caption-text loading">${loadingText}</span>
    <input type="checkbox" id="caption1-checkbox" class="caption-checkbox">
    <div class="choose-label">scegli</div> <!-- La label "scegli" è ora sotto la checkbox -->
    <div class="copy-icon"><i class="fas fa-copy"></i> Copia</div>
`;
        captionContainer.appendChild(captionBox1);

        const captionBox2 = document.createElement('div');
        captionBox2.className = 'caption-box';
        captionBox2.innerHTML = `
            <span class="caption-text loading">${loadingText}</span>
            <input type="checkbox" id="caption2-checkbox" class="caption-checkbox">
            <div class="choose-label">scegli</div>
            <div class="copy-icon"><i class="fas fa-copy"></i> Copia</div>
        `;
        captionContainer.appendChild(captionBox2);

        // Aggiungi l'effetto lampeggiante al testo
        document.querySelectorAll('.loading').forEach(el => {
            el.classList.add('blinking');
        });

        // Genera due caption separate con lo stile selezionato
        const caption1 = await generateCaptionWithAI(imageBase64, selectedStyle);
        const caption2 = await generateCaptionWithAI(imageBase64, selectedStyle);

        console.log('Caption 1:', caption1);
        console.log('Caption 2:', caption2);

        // Aggiorna il contenuto delle caption con il testo definitivo e rimuovi l'effetto lampeggiante
        const captionText1 = captionBox1.querySelector('.caption-text');
        captionText1.textContent = caption1;
        captionText1.classList.remove('blinking');

        const captionText2 = captionBox2.querySelector('.caption-text');
        captionText2.textContent = caption2;
        captionText2.classList.remove('blinking');

        // Imposta il valore data-caption correttamente per le checkbox
        captionBox1.querySelector('.caption-checkbox').setAttribute('data-caption', caption1);
        captionBox2.querySelector('.caption-checkbox').setAttribute('data-caption', caption2);

        // Aggiungi eventi per aggiornare selectedCaption quando una checkbox viene selezionata
        document.querySelectorAll('.caption-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                console.log('Evento change attivato per:', this.id);
                const caption = this.getAttribute('data-caption');
                console.log('Valore data-caption:', caption);

                // Aggiorna il testo e il colore della checkbox selezionata
                document.querySelectorAll('.caption-box').forEach(box => {
                    const boxCheckbox = box.querySelector('.caption-checkbox');
                    const label = box.querySelector('.choose-label');
                    
                    if (boxCheckbox.checked) {
                        label.textContent = 'ok';
                        label.style.color = '#81c784'; // Verde chiaro
                    } else {
                        label.textContent = '';
                        boxCheckbox.classList.add('checkbox-not-selected');
                    }
                });
                
                if (caption) {
                    selectedCaption = caption;
                    console.log('Caption selezionata aggiornata:', selectedCaption);
                } else {
                    console.error('Errore: data-caption non è presente o è vuoto.');
                }

                if (!selectedCaption || selectedCaption.trim() === "") {
                    console.error('Errore: selectedCaption è vuota dopo la selezione della checkbox.');
                } else {
                    console.log('selectedCaption aggiornata con successo:', selectedCaption);
                }
            });
        });

        // Aggiungi funzionalità per copiare il testo della caption
        document.querySelectorAll('.copy-icon').forEach(copyIcon => {
            copyIcon.addEventListener('click', function() {
                const captionToCopy = this.parentElement.querySelector('.caption-text').textContent;
                console.log('Tentativo di copiare la Caption:', captionToCopy);
                copyToClipboard(captionToCopy);
            });
        });

        document.getElementById('step4Container').style.display = 'block';
        document.getElementById('generateBtn').style.backgroundColor = '#d3d3d3';

    } catch (error) {
        console.error('Errore durante la generazione delle caption:', error);
        alert('Si è verificato un errore durante la generazione delle caption.');
    }
});

// Caricamento dell'immagine selezionata dall'utente
document.getElementById('imageUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imageText').style.display = 'inline';
        document.getElementById('imagePreview').style.display = 'block';

        if (selectedStyle) {
            document.getElementById('generateBtn').style.backgroundColor = '#28a745';
        }
    };
    reader.readAsDataURL(file);
});

// Funzione per copiare il testo negli appunti
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Caption copiata negli appunti!');
}

/// Funzione per aggiornare l'anteprima del post Instagram
document.getElementById('previewBtn').addEventListener('click', () => {
    console.log('Pulsante "Vedi l\'anteprima del tuo post" cliccato');
    
    const instagramCaption = document.getElementById('instagramCaption');
    const instagramPreview = document.getElementById('instagramPreview');
    const instagramImage = document.getElementById('instagramImage');

    if (!selectedCaption || selectedCaption.trim() === '') {
        console.error('Nessuna caption selezionata.');
        alert('Seleziona una caption prima di vedere l\'anteprima.');
        return;
    }

    console.log('Aggiornamento dell\'anteprima con la caption selezionata:', selectedCaption);
    instagramCaption.textContent = selectedCaption;

    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview.src) {
        console.error('Nessuna immagine caricata.');
        alert('Carica un\'immagine prima di vedere l\'anteprima.');
        return;
    }

    console.log('Immagine caricata correttamente:', imagePreview.src);

    const screenWidth = window.innerWidth;
    console.log('Larghezza dello schermo:', screenWidth);

    // Ridimensiona l'immagine al 70% della larghezza dello schermo
    const desiredWidth = screenWidth * 0.7;
    instagramImage.style.width = `${desiredWidth}px`;
    instagramImage.style.height = 'auto'; // Mantieni le proporzioni
    instagramImage.src = imagePreview.src; // Imposta l'immagine dell'anteprima
    
    console.log('Larghezza immagine impostata al 70% dello schermo:', instagramImage.style.width);
    console.log('Immagine impostata correttamente nell\'anteprima.');

    instagramPreview.style.display = 'block';
    console.log('Anteprima visualizzata con successo.');

    // Mostra il pulsante di condivisione WhatsApp
    document.getElementById('condividiWhatsAppBtn').style.display = 'block';
    document.getElementById('screenshotBtn').style.display = 'block';
});

function condividiSuWhatsApp() {
    console.log('Tentativo di condivisione su WhatsApp');
    const instagramImage = document.getElementById('instagramImage');
    const instagramCaption = document.getElementById('instagramCaption');
    
    if (!instagramImage.src || !instagramCaption.textContent) {
        console.error('Immagine o caption mancanti');
        alert('Genera prima l\'anteprima del post');
        return;
    }

    const text = encodeURIComponent(instagramCaption.textContent);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    
    console.log('URL di condivisione WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
}

// Aggiungi questa funzione per catturare lo screenshot
function catturaScrennshot() {
    const instagramPreview = document.getElementById('instagramPreview');
    
    if (!instagramPreview || instagramPreview.style.display === 'none') {
        alert('Genera prima l\'anteprima del post');
        return;
    }

    html2canvas(instagramPreview).then(canvas => {
        const screenshotDataUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = screenshotDataUrl;
        downloadLink.download = 'instagram_post_screenshot.png';
        downloadLink.click();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const condividiButton = document.createElement('button');
    condividiButton.id = 'condividiWhatsAppBtn';
    condividiButton.textContent = 'Condividi su WhatsApp';
    condividiButton.style.display = 'none';
    condividiButton.addEventListener('click', condividiSuWhatsApp);
    
    document.body.appendChild(condividiButton);

    // Crea il pulsante per lo screenshot
    const screenshotButton = document.createElement('button');
    screenshotButton.id = 'screenshotBtn';
    screenshotButton.textContent = 'Fai uno screenshot dell\'anteprima';
    screenshotButton.style.display = 'none';
    screenshotButton.addEventListener('click', catturaScrennshot);
    
    document.body.appendChild(screenshotButton);
});

let isLogin = true;
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const switchAuth = document.getElementById('switchAuth');
const accountIcon = document.getElementById('accountIcon');

let users = [];

// Funzione per caricare gli utenti dal file JSON
function loadUsers() {
    fetch('users.json')
        .then(response => response.json())
        .then(data => {
            users = data.users;
        })
        .catch(error => console.error('Errore nel caricamento degli utenti:', error));
}

// Funzione per salvare gli utenti nel file JSON
function saveUsers() {
    fetch('users.json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: users })
    })
    .then(response => response.json())
    .then(data => console.log('Utenti salvati con successo'))
    .catch(error => console.error('Errore nel salvataggio degli utenti:', error));
}

// Carica gli utenti all'avvio dell'applicazione
loadUsers();

accountIcon.addEventListener('click', () => {
    authModal.style.display = 'block';
});

document.querySelector('.close').addEventListener('click', () => {
    authModal.style.display = 'none';
});

switchAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Accedi' : 'Registrati';
    authForm.querySelector('button').textContent = isLogin ? 'Accedi' : 'Registrati';
    switchAuth.innerHTML = isLogin ? 'Non hai un account? <a href="#">Registrati</a>' : 'Hai già un account? <a href="#">Accedi</a>';
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (isLogin) {
        // Login
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            authModal.style.display = 'none';
            updateAccountIcon(true);
            alert('Accesso effettuato con successo!');
        } else {
            alert('Username o password non validi.');
        }
    } else {
        // Registrazione
        if (users.some(u => u.username === username)) {
            alert('Username già in uso. Scegline un altro.');
        } else {
            const newUser = { username, password };
            users.push(newUser);
            saveUsers(); // Salva gli utenti nel file JSON
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            authModal.style.display = 'none';
            updateAccountIcon(true);
            alert('Registrazione effettuata con successo!');
        }
    }
});

function updateAccountIcon(isLoggedIn) {
    if (isLoggedIn) {
        accountIcon.innerHTML = '<i class="fas fa-user-check"></i>';
    } else {
        accountIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
}

// Controlla se l'utente è già loggato all'avvio dell'applicazione
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateAccountIcon(true);
    }
});
