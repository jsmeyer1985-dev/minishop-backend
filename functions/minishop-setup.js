exports.handler = async (event) => {
  try {
    // Ensure POST
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse form body
    const formData = new URLSearchParams(event.body);

    // Env vars configured in Netlify UI
    const SHOP = process.env.SHOPIFY_STORE; // e.g. your-store-name.myshopify.com
    const TOKEN = process.env.SHOPIFY_API_TOKEN;

    // Required fields
    const customer_id = formData.get('customer_id');
    const minishop_name = formData.get('minishop_name');

    // Optional fields
    const minishop_banner = formData.get('banner_subtext') || '';
    const reseller_name = formData.get('reseller_name') || '';
    const whatsapp_number = formData.get('whatsapp_number') || '';
    const whatsapp_group = formData.get('whatsapp_group') || '';
    const about_us = formData.get('about_us') || '';
    const button_color = formData.get('button_color') || ''; // store hex as text
    const shipping_fee = formData.get('shipping_fee') || '';
    const bank_name = formData.get('bank_name') || '';
    const account_holder = formData.get('account_holder') || '';
    const account_number = formData.get('account_number') || '';
    const branch_code = formData.get('branch_code') || '';
    const markup = formData.get('markup') || '';

    if (!SHOP || !TOKEN) {
      return { statusCode: 500, body: 'Server config error: missing SHOPIFY_STORE or SHOPIFY_API_TOKEN' };
    }
    if (!customer_id || !minishop_name) {
      return { statusCode: 400, body: 'Missing required fields: customer_id and minishop_name' };
    }

    // Metafields payloads
    const metafields = [
      { key: 'minishop_name', value: minishop_name, type: 'single_line_text_field' },
      { key: 'minishop_banner', value: minishop_banner, type: 'single_line_text_field' },
      { key: 'minishop_reseller', value: reseller_name, type: 'single_line_text_field' },
      { key: 'minishop_whatsapp', value: whatsapp_number, type: 'single_line_text_field' },
      { key: 'minishop_group', value: whatsapp_group, type: 'url' },
      { key: 'minishop_about', value: about_us, type: 'multi_line_text_field' },
      { key: 'minishop_buttoncolor', value: button_color, type: 'single_line_text_field' },
      { key: 'minishop_shippingfee', value: shipping_fee, type: 'number_integer' },
      { key: 'minishop_bankname', value: bank_name, type: 'single_line_text_field' },
      { key: 'minishop_accountholder', value: account_holder, type: 'single_line_text_field' },
      { key: 'minishop_accountnumber', value: account_number, type: 'single_line_text_field' },
      { key: 'minishop_branchcode', value: branch_code, type: 'single_line_text_field' },
      { key: 'minishop_markup', value: markup, type: 'number_integer' }
    ].filter(m => m.value !== '');

    // Helper: POST to Shopify Admin API with fetch
    const shopifyPost = async (path, body) => {
      const res = await fetch(`https://${SHOP}/admin/api/2025-01/${path}`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify error ${res.status}: ${text}`);
      }
      return res.json();
    };

    // Save metafields
    for (const field of metafields) {
      await shopifyPost('metafields.json', {
        metafield: {
          namespace: 'minishop',
          key: field.key,
          value: field.value,
          type: field.type,
          owner_id: Number(customer_id),
          owner_resource: 'customer'
        }
      });
    }

    // Create page
    const handle = `ms-${minishop_name.toLowerCase().trim().replace(/\s+/g, '-')}`;
    await shopifyPost('pages.json', {
      page: {
        title: minishop_name,
        handle,
        template_suffix: 'minishop-template',
        body_html: `<p>This MiniShop is powered by ${reseller_name || 'our reseller network'}.</p>`
      }
    });

    // Redirect to Shopify page
    return {
      statusCode: 302,
      headers: {
        Location: `/pages/${handle}`
      },
      body: ''
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `MiniShop setup failed: ${err.message}`
    };
  }
};
