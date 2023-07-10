<script>
    /** @type {import('./$types').PageData} */
    export let data
</script>

<div class="mx-auto my-10 max-w-2xl rounded-lg bg-base-300 p-8">
    <div class="prose">
        <div>
            <h1>About BasicPay</h1>
            <p>
                There are over <strong>{data.num_records} assets</strong> on the Testnet alone. Learn
                how to harness that power in your app!
            </p>
            <ul>
                <li>The most recent asset issued was: <code>{data.most_recent.code}</code>.</li>
                <li>It was issued by: <code>{data.most_recent.issuer}</code></li>
            </ul>
            <p>
                Here is a random public key, just for fun: <code>{data.random_public_key}</code>
            </p>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras in nisl at enim tempus
                scelerisque. Vestibulum feugiat arcu vitae efficitur sodales. Aenean ac facilisis
                lectus. Sed vel elit velit. Suspendisse vel eros auctor, interdum est et, eleifend
                justo. Praesent at tortor est. In non est nec odio tristique interdum et nec neque.
                Quisque eros tellus, imperdiet at velit sed, finibus sollicitudin nulla. Aliquam
                aliquam, ex hendrerit egestas luctus, lectus ipsum placerat massa, ut porttitor
                tellus eros sed libero. Mauris quis nisi id ipsum mollis egestas.
            </p>
            <p>
                Proin eget placerat lacus, condimentum faucibus dolor. Proin vestibulum nulla non
                ullamcorper auctor. Etiam at urna dui. Phasellus ac magna ullamcorper, mattis tortor
                semper, luctus urna. Nam in efficitur mi. In ornare commodo gravida. Nam nisi eros,
                venenatis nec dui vel, scelerisque ultricies ligula. Nunc ac dui et justo fringilla
                maximus. Nunc nec turpis eget leo volutpat sodales. Nam vitae faucibus libero. Nam
                congue vel felis efficitur auctor. Nullam commodo varius odio sed aliquam.
                Pellentesque aliquet porta justo, et rhoncus diam iaculis congue. Nam placerat velit
                in feugiat blandit.
            </p>
            <p>
                Duis sollicitudin justo turpis. Duis ut mauris justo. Pellentesque lacus felis,
                fringilla non nisl quis, sodales faucibus erat. Donec erat dui, vestibulum sed
                lobortis vitae, bibendum sed sapien. Nulla dictum sagittis molestie. Etiam
                consectetur, diam nec aliquet vestibulum, nibh nibh ultrices metus, ac tristique
                magna lectus vel turpis. Proin sit amet molestie tortor, id rutrum diam. Maecenas
                consequat consequat urna, eget consequat ex ultricies ut. Aliquam molestie velit nec
                neque eleifend feugiat. Vivamus ipsum lorem, congue quis fermentum nec, luctus
                dapibus ante. Praesent mauris libero, efficitur varius odio in, lobortis luctus
                magna. Maecenas hendrerit finibus tortor, eu venenatis nibh bibendum eget. Nam at
                purus sit amet justo vulputate dictum. Sed a suscipit ante, a cursus felis.
            </p>
            <p>
                Vivamus ac magna sed nulla cursus congue et nec massa. Integer sollicitudin mi at
                orci varius iaculis. Vestibulum vitae libero dui. Sed imperdiet ante arcu, quis
                blandit diam consectetur sed. Nulla id metus vestibulum felis tempor blandit nec id
                mi. Praesent ac consequat dui, nec congue ante. Morbi lacinia mauris non accumsan
                posuere. Suspendisse massa urna, interdum sed libero eu, semper pretium neque. Donec
                suscipit fringilla dolor, vel sagittis orci posuere faucibus.
            </p>
            <p>
                Morbi arcu urna, sollicitudin a tempor quis, ultrices id tellus. Mauris et venenatis
                diam, sit amet blandit ante. In mi risus, lobortis quis lobortis vitae, rutrum id
                tortor. Aliquam sagittis commodo purus et elementum. Mauris eget lorem dictum,
                iaculis turpis pulvinar, interdum enim. Etiam placerat risus purus, nec eleifend
                magna commodo in. Praesent vestibulum justo eu massa maximus cursus. In sit amet
                lacinia arcu, ac posuere risus. Praesent vitae feugiat lacus. Nullam ante purus,
                molestie in pharetra ac, cursus eget lectus. Suspendisse at nulla et tortor porta
                auctor et sit amet metus.
            </p>
        </div>
    </div>
</div>
