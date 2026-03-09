document.addEventListener("DOMContentLoaded", () => {
    let currentView = 0;

    function showResponse(id) {
        let cards = document.querySelectorAll('.response-card');

        for (let i = 0; i < cards.length; i++) {
            if (i === id) {
                cards[i].style.display = 'block'; 
            } else {
                cards[i].style.display = 'none'; 
            }
        }
    }

    const pbutton = document.getElementById('prev');
    const nbutton = document.getElementById('next');

    if (pbutton && nbutton) {
        pbutton.addEventListener('click', () => {
            if (currentView > 0) {
                currentView--;
                showResponse(currentView);
            }
        });

        nbutton.addEventListener('click', () => {
            let cards = document.querySelectorAll('.response-card');
            if (currentView < cards.length - 1) {
                currentView++;
                showResponse(currentView);
            }
        });

        showResponse(currentView);
    }
});