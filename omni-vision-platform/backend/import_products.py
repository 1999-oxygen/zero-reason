#!/usr/bin/env python3
"""
Product Import Script for OmniVision
Imports liquor products from CSV into SQLite database
"""

import sys
import csv
import sqlite3
from pathlib import Path

def import_products(csv_file):
    """Import products from CSV file"""
    db_path = Path(__file__).parent / "omnivision.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ensure products table exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER UNIQUE,
            brand_name TEXT NOT NULL,
            buying_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            category TEXT DEFAULT 'liquor',
            stock INTEGER DEFAULT 0
        )
    ''')
    
    imported = 0
    updated = 0
    errors = 0
    
    print(f"📦 Importing products from {csv_file}...")
    print("─" * 60)
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                brand_name = row['brand_name'].strip()
                buying_price = float(row['buying_price'])
                selling_price = float(row['selling_price'])
                category = row.get('category', 'liquor').strip()
                stock = int(row.get('stock', 0))
                class_id = int(row.get('class_id', 0))
                
                # Calculate profit
                profit = selling_price - buying_price
                profit_margin = (profit / buying_price * 100) if buying_price > 0 else 0
                
                # Try to insert or update
                cursor.execute('''
                    INSERT INTO products (class_id, brand_name, buying_price, selling_price, category, stock)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(class_id) DO UPDATE SET
                        brand_name = excluded.brand_name,
                        buying_price = excluded.buying_price,
                        selling_price = excluded.selling_price,
                        category = excluded.category,
                        stock = excluded.stock
                ''', (class_id, brand_name, buying_price, selling_price, category, stock))
                
                if cursor.rowcount > 0:
                    if cursor.lastrowid:
                        imported += 1
                        status = "✅ ADDED"
                    else:
                        updated += 1
                        status = "🔄 UPDATED"
                    
                    print(f"{status} | {brand_name}")
                    print(f"         Buy: KES {buying_price:.2f} | Sell: KES {selling_price:.2f} | Profit: KES {profit:.2f} ({profit_margin:.1f}%)")
                    print(f"         Stock: {stock} | Class ID: {class_id}")
                    print()
                
            except Exception as e:
                errors += 1
                print(f"❌ ERROR | {row.get('brand_name', 'Unknown')}: {e}")
                print()
    
    conn.commit()
    conn.close()
    
    print("─" * 60)
    print(f"✅ Import complete!")
    print(f"   Added: {imported} | Updated: {updated} | Errors: {errors}")
    print()
    
    # Show summary
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), SUM(stock), category FROM products GROUP BY category")
    print("📊 Product Summary:")
    for row in cursor.fetchall():
        print(f"   {row[2]}: {row[0]} products, {row[1]} total stock")
    conn.close()

def create_sample_csv():
    """Create a sample products CSV file"""
    sample_file = Path(__file__).parent.parent / "sample_products.csv"
    
    sample_data = [
        ["brand_name", "buying_price", "selling_price", "category", "stock", "class_id"],
        ["Tusker_Lager_500ml", "150", "220", "liquor", "48", "41"],
        ["Chrome_Vodka_250ml", "180", "250", "liquor", "24", "39"],
        ["Johnnie_Walker_Black_750ml", "2800", "3500", "liquor", "12", "42"],
        ["Smirnoff_Ice_300ml", "120", "180", "liquor", "36", "43"],
        ["Heineken_330ml", "100", "150", "liquor", "50", "44"],
        ["Guinness_500ml", "140", "200", "liquor", "30", "45"],
        ["Baileys_750ml", "1800", "2300", "liquor", "15", "46"],
        ["Captain_Morgan_750ml", "1200", "1600", "liquor", "20", "47"],
        ["Absolut_Vodka_750ml", "1500", "2000", "liquor", "18", "48"],
        ["Jack_Daniels_750ml", "2200", "2800", "liquor", "10", "49"],
    ]
    
    with open(sample_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(sample_data)
    
    print(f"📝 Sample CSV created: {sample_file}")
    print(f"   Edit this file with your products, then run:")
    print(f"   python3 {__file__} {sample_file}")
    print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 import_products.py <csv_file>")
        print("   or: python3 import_products.py --sample  (to create sample CSV)")
        print()
        create_sample_csv()
    elif sys.argv[1] == "--sample":
        create_sample_csv()
    else:
        import_products(sys.argv[1])
