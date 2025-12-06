(async ()=>{
  try {
    // Step 1: Create a direct order with a dummy but valid ObjectId
    console.log('\n=== STEP 1: CREATE DIRECT ORDER ===');
    const createBody = { 
      items:[
        {name:'Test Burger',price:100,totalPrice:100,quantity:1},
        {name:'Fries',price:50,totalPrice:50,quantity:1}
      ], 
      serviceType:'pickup', 
      paymentMethod:'card', 
      customerInfo:{name:'Test Guest', phone:'+201000000000'},
      userId:'000000000000000000000001' // MongoDB valid ObjectId-like string
    };
    const createRes = await fetch('http://localhost:8000/api/orders/direct', { 
      method:'POST', 
      headers:{ 'Content-Type':'application/json' }, 
      body: JSON.stringify(createBody) 
    });
    console.log('CREATE STATUS', createRes.status);
    const createText = await createRes.text();
    let orderData;
    try { 
      const parsed = JSON.parse(createText);
      console.log('ORDER CREATED:', JSON.stringify(parsed, null, 2));
      if (parsed.success && parsed.data) orderData = parsed.data;
      else if (parsed.data) orderData = parsed.data;
      else orderData = parsed;
    } catch(e){ 
      console.log('RAW RESPONSE:', createText); 
      return;
    }

    const orderId = orderData?._id || orderData?.id;
    console.log('Order ID:', orderId);

    if (!orderId) {
      console.error('Failed to get order ID');
      return;
    }

    // Step 2: Fetch order by ID to verify it was saved with userId
    console.log('\n=== STEP 2: FETCH ORDER BY ID ===');
    const getRes = await fetch(`http://localhost:3000/api/orders/${orderId}`);
    console.log('GET STATUS', getRes.status);
    const getJson = await getRes.json();
    console.log('ORDER DATA:', JSON.stringify(getJson, null, 2));

    // Step 3: Update status to confirmed via dev endpoint (simulating cashier action)
    console.log('\n=== STEP 3: UPDATE STATUS TO CONFIRMED (Cashier Action) ===');
    const statusRes = await fetch(`http://localhost:3000/api/orders/dev/${orderId}/status`, { 
      method:'POST', 
      headers:{ 'Content-Type':'application/json' }, 
      body: JSON.stringify({ status: 'confirmed' }) 
    });
    console.log('STATUS UPDATE RESPONSE:', statusRes.status);
    const statusJson = await statusRes.json();
    console.log('UPDATED ORDER:', JSON.stringify(statusJson, null, 2));

    // Step 4: Update status to ready (simulating kitchen action)
    console.log('\n=== STEP 4: UPDATE STATUS TO READY (Kitchen Action) ===');
    const readyRes = await fetch(`http://localhost:3000/api/orders/dev/${orderId}/status`, { 
      method:'POST', 
      headers:{ 'Content-Type':'application/json' }, 
      body: JSON.stringify({ status: 'ready' }) 
    });
    console.log('READY UPDATE RESPONSE:', readyRes.status);
    const readyJson = await readyRes.json();
    console.log('READY ORDER:', JSON.stringify(readyJson, null, 2));

    // Step 5: Update payment status to paid
    console.log('\n=== STEP 5: UPDATE PAYMENT TO PAID ===');
    const payRes = await fetch(`http://localhost:3000/api/orders/${orderId}/payment`, { 
      method:'PATCH', 
      headers:{ 'Content-Type':'application/json' }, 
      body: JSON.stringify({ paymentStatus: 'paid' }) 
    });
    console.log('PAYMENT UPDATE RESPONSE:', payRes.status);
    const payJson = await payRes.json();
    console.log('PAID ORDER:', JSON.stringify(payJson, null, 2));

    console.log('\n=== TEST COMPLETE ===\nCheck server logs for socket emissions');

  } catch(e){ 
    console.error('ERROR:', e.message); 
    process.exit(1); 
  }
})();

