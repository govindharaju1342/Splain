// var rules_basic = {
//   condition: 'AND',
//   rules: [{
//     id: 'price',
//     operator: 'less',
//     value: 10.25
//   }, {
//     condition: 'OR',
//     rules: [{
//       id: 'category',
//       operator: 'equal',
//       value: 2
//     }, {
//       id: 'category',
//       operator: 'equal',
//       value: 1
//     }]
//   }]
// };

// $('#builder-basic').queryBuilder({
//   plugins: ['bt-tooltip-errors'],
//   filters: [{
//     id: '5723b6380a00b2746778a3b9',
//     label: 'Requisition Title',
//     type: 'string',
//     operators: ['equal', 'not_equal', 'in', 'not_in', 'is_null', 'is_not_null']
//   }, {
//     id: '5723b6600a00b2746778a591',
//     label: 'Requisition Number',
//     type: 'string',
//     operators: ['equal', 'not_equal', 'in', 'not_in', 'is_null', 'is_not_null']
//   } ],
//
//   rules: rules_basic
// });

$('#btn-reset').on('click', function() {
  $('#builder-basic').queryBuilder('reset');
});

$('#btn-set').on('click', function() {
  $('#builder-basic').queryBuilder('setRules', rules_basic);
});

$('#btn-get').on('click', function() {
  var result = $('#builder-basic').queryBuilder('getRules');

  if (!$.isEmptyObject(result)) {
    alert(JSON.stringify(result, null, 2));
  }
});
