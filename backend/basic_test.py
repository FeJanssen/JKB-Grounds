import json

def lambda_handler(event, context):
    """
    Ultra-basic Lambda handler ohne Dependencies
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps({
            'message': 'Basic Lambda test successful',
            'event': str(event)[:100],  # First 100 chars of event for debugging
            'method': event.get('requestContext', {}).get('http', {}).get('method', 'Unknown'),
            'path': event.get('rawPath', 'Unknown')
        })
    }
