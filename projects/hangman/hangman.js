(function () {
    var responseText;
    start();
    function start() {
    var xhr = new XMLHttpRequest;
    xhr.open('GET', 'http://randomword.setgetgo.com/get.php');

    xhr.addEventListener('readystatechange', getWord)
        function getWord() {
          if (xhr.readyState != XMLHttpRequest.DONE) {
              return;
          }
          var status;
          try {
              status = xhr.status;
          } catch(e) {
              return;
          }
          if (status != 200) {
              return;
          }
          responseText = xhr.responseText;
          console.log('getWord');
          checkWord();
          }
    xhr.send();
    }

    function checkWord() {
        if(6 <= responseText.length && responseText.length <= 12) {
            console.log((responseText.length));
            console.log('1.if');
            clickStartButton();
        }
        else if(6 > responseText.length || responseText.length > 12) {
            console.log('2.if');
            start();
        }
        else if(typeof responseText == undefined) {
            console.log('3.if');
            start();
        }
        else {
            console.log('3.if');
            pickWord();
        }
    }


    function pickWord() {
        var words = ['letter', 'hangman', 'computer', 'newspaper', 'bicycle', 'supermarket', 'cinema', 'hollidays', 'element', 'batman'];
        var selector = Math.floor(Math.random()*10);
        responseText = words[selector];
        console.log(responseText);
        clickStartButton();
    }


    function clickStartButton() {
        var button = document.getElementsByClassName('startButton');
        var overlay = document.getElementsByClassName('overlay');
        var outer = document.getElementsByClassName('outer');
        button[0].addEventListener('click', function(){
            button[0].classList.add('invisible');
            overlay[0].classList.add('invisible');
            outer[0].classList.add('invisible');
            startGame();
        })
    }

        function startGame() {
            var randomWord = responseText.toUpperCase();
            var wrong = document.getElementById('wrongletters');
            var key;
            var lineArray = [].slice.call(document.getElementsByClassName('line'));
            var letterContainer = [].slice.call(document.getElementsByClassName('letter'));

            var letters = randomWord.split('');
            var isInWord;
            var positionsInWord = [];
            var wrongLetters = [];
            var counter = -1;
            var correctLetters = [];

            showLines();

            console.log(randomWord);
            console.log(letters);


            function showLines() {
              for (var i = 0; i < randomWord.length; i++) {
                lineArray[i].classList.add('displayLine');
                letterContainer[i].innerHTML = letters[i];
              }
            }


            var form = document.getElementById('form');
            var input = document.getElementById('input');
            form.addEventListener('submit', getKey);

           function getKey(e){
                key = (input.value).toUpperCase();
                console.log(key);
                isInWord = isLetterInWord(letters, key);
                makeLettersVisible();
                form.reset();
                e.preventDefault();
            }


            var solveButton = document.getElementById('solveButton');
            var form2 = document.getElementById('form2');
            var guess;
            solveButton.addEventListener('click', solve);

            function solve(e) {
                document.getElementById('solve').classList.remove('hidden');
                document.getElementById('guess').classList.remove('hidden');
                solveButton.removeEventListener('click', solve);
                form2.addEventListener('submit', submitSolution);

                function submitSolution(e) {
                    guess = document.getElementById('guess').value;
                    checkGuess();
                    e.preventDefault();
                }
                e.preventDefault();
            }


            function checkGuess() {
                var guessLetters = guess.split('');
                    if(randomWord === guess) {
                        document.getElementById('won').classList.remove('hidden');
                    }
                    else {
                        for(counter = 0; counter <= 5; counter++)
                        youLost();
                    }
            }


            function isLetterInWord(arr, k) {
                return arr.some(function(arrVal) {
                return k === arrVal;
            });
            }


            function makeLettersVisible() {
                if(isLetterInWord(correctLetters, key)) {
                    counter++;
                    console.log('hi');
                    youLost();
                }
                else if(isInWord) {
                    for(var i = 0; i < letters.length; i++) {
                        if(key === letters[i]) {
                        positionsInWord.push(i);
                        correctLetters.push(key);
                        letterContainer[i].classList.add('displayLetter');
                        youWon();
                        }
                    }
                }
                else {
                    wrongLetters.push(key);
                    wrong.innerHTML += ' '+key;
                    counter++;
                    youLost();
                }
            }


            function youWon() {
                if(letters.length === correctLetters.length) {
                    document.getElementById('won').classList.remove('hidden');
                }
            }


            function youLost() {
                if(counter === 5) {
                    console.log('you lost');
                    document.getElementById('lost').classList.remove('hidden');
                }
                draw();
            }


            var context = document.getElementById('canv1').getContext('2d');
            context.moveTo(100, 550);
            context.lineTo(100, 50);
            context.stroke();
            context.moveTo(100, 50);
            context.lineTo(300, 50);
            context.stroke();
            context.moveTo(300, 50);
            context.lineTo(300, 150);
            context.stroke();
            context.beginPath();
            context.arc(100, 628, 80, 0, 1*Math.PI, true);
            context.stroke();

            function draw() {
                var drawStickfigure = [
                function drawHead(){
                    context.beginPath();
                    context.arc(300, 200, 50, 0, 2 * Math.PI);
                    context.stroke();
                },
                function drawBody() {
                    context.beginPath();
                    context.moveTo(300, 250);
                    context.lineTo(300, 450);
                    context.stroke();
                },
                function drawLeftLeg() {
                    context.beginPath();
                    context.moveTo(300, 450);
                    context.lineTo(400, 550);
                    context.stroke();
                },
                function drawRightLeg() {
                    context.beginPath();
                    context.moveTo(300, 450);
                    context.lineTo(200, 550);
                    context.stroke();
                },
                function drawLeftArm() {
                    context.beginPath();
                    context.moveTo(300, 350);
                    context.lineTo(400, 300);
                    context.stroke();
                },
                function drawRightArm() {
                    context.beginPath();
                    context.moveTo(300, 350);
                    context.lineTo(200, 300);
                    context.stroke();
                }
            ]
            console.log(counter);
            drawStickfigure[counter]();
            }

        }

    var restartButton = document.getElementsByClassName('playAgain');
    restartButton[0].addEventListener('click', restart);
    restartButton[1].addEventListener('click', restart);

    function restart() {
        document.location.reload(true);
    }
})();
