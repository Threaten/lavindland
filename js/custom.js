$(document).ready(function() {

   Stripe.setPublishableKey('pk_test_kL77hUk3frbCACuDHf6UZ3c3');
  //four slide
  $(".four-slide").owlCarousel({
    autoPlay: 3000, //Set AutoPlay to 3 seconds
    items : 4,
    transitionStyle:"fade",
    itemsDesktop : [1199,3],
    itemsDesktopSmall : [979,3]

  });
  //three slide
  $(".three-slide").owlCarousel({
    autoPlay: 3000, //Set AutoPlay to 3 seconds
    items : 3,
    transitionStyle:"fade",
    itemsDesktop : [1199,3],
    itemsDesktopSmall : [979,3]

  });
  //six slide
  $(".six-slide").owlCarousel({
    autoPlay: 3000, //Set AutoPlay to 3 seconds
    items : 6,
    nav : true,
    transitionStyle:"fade",
    itemsDesktop : [1199,3],
    itemsDesktopSmall : [979,3]

  });

  //smooth scroll
  $(function() {
    $('.scroll').click(function() {
      if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          $('html, body').animate({
            scrollTop: target.offset().top
          }, 800);
          return false;
        }
      }
    });
  });

  //instant search
  $(function() {
    $('#search').keyup(function() {
      var search = $(this).val();
      $.ajax({
        method: 'POST',
        url: '/api/search',
        data: {
          search
        },
        dataType: 'json',
        success: function(json) {
          var data = json.hits.hits.map(function(hit) {
            return hit;
          });

          $('#search_results').empty();
          for (var i = 0; i < data.length; i++) {
            var html = "";
            html += '<div class="col-md-4">';
            html += '<a href="/product/' +  data[i]._source._id + '">';
            html += '<div class="thumbnail">';
            html += '<img src="' + data[i]._source.img  +' ">';
            html += '<div class="caption">';
            html += '<h3>' +  data[i]._source.name + '</h3>';
            html += '<p>' +  data[i]._source.category.name  + '</p>';
            html += '<p>' +  data[i]._source.price  + '</p>';
            html += '</div></di></a></div>';

            $('#search_results').append(html);
          }
          console.log(data);
        },
        error: function(error) {
          console.log(error);
        }
      });
    });

    $(document).on('click', '#plus', function (e) {
      e.preventDefault();
      var priceTotal = parseFloat($('#priceTotal').val());
      var quantity = parseInt($('#quantity').val());

      priceTotal += parseFloat($('#priceHidden').val());
      quantity += 1;

      $('#quantity').val(quantity);
      $('#priceTotal').val(priceTotal);
      $('#priceDisplay').text(priceTotal.toFixed(2));
      $('#total').html(quantity);
    });

    $(document).on('click', '#minus', function (e) {
      e.preventDefault();
      var priceTotal = parseFloat($('#priceTotal').val());
      var quantity = parseInt($('#quantity').val());

      if (quantity == 1) {
        priceTotal = parseFloat($('#priceHidden').val());
        quantity = 1;
      } else {
        priceTotal -= parseFloat($('#priceHidden').val());
        quantity -= 1;
      }

      $('#quantity').val(quantity);
      $('#priceTotal').val(priceTotal);
      $('#priceDisplay').text(priceTotal.toFixed(2));
      $('#total').html(quantity);
    });


    function stripeResponseHandler(status, response) {
      // Grab the form:
      var $form = $('#payment-form');

      if (response.error) { // Problem!

        // Show the errors on the form:
        $form.find('.payment-errors').text(response.error.message);
        $form.find('.submit').prop('disabled', false); // Re-enable submission

      } else { // Token was created!

        // Get the token ID:
        var token = response.id;

        // Insert the token ID into the form so it gets submitted to the server:
        $form.append($('<input type="hidden" name="stripeToken">').val(token));

        // Submit the form:
        $form.get(0).submit();
      }
    };

    var $form = $('#payment-form');
    $form.submit(function(event) {
      // Disable the submit button to prevent repeated clicks:
      $form.find('.submit').prop('disabled', true);

      // Request a token from Stripe:
      Stripe.card.createToken($form, stripeResponseHandler);

      // Prevent the form from being submitted:
      return false;
    });
  });
});
