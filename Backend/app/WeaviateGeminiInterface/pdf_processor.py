import fitz
import os
import camelot
import pandas as pd
#extracting text from a single pdf
def extract_text_from_pdf(pdf_path):
    """Extracts text from a single PDF file."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return None

#chunking the text for storing it into the collection later
def chunk_text(text, chunk_size=300, overlap=50):
    """Splits text into overlapping chunks of a specified word count."""
    words = text.split()
    if not words:
        return []
    
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = words[start:end]
        chunks.append(" ".join(chunk))
        start += chunk_size - overlap # Move window forward with overlap
    return chunks

# processing multiple PDFs from a directory
def process_pdfs_in_directory(directory_path):
    """
    Processes all PDF files, extracting tables and non-table text separately to avoid redundancy.
    It identifies table locations and blanks them out before extracting the remaining page text.
    """
    all_data_objects = []
    
    if not os.path.isdir(directory_path):
        print(f"Error: Directory '{directory_path}' not found.")
        return []

    for filename in os.listdir(directory_path):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(directory_path, filename)
            print(f"\n--- Processing file: {filename} ---")
            
            try:
                # --- Step 1: Extract Tables with Camelot and get their locations ---
                # CORRECTED: Using 'lattice' as it's more accurate for tables with clear grid lines.
                tables = camelot.read_pdf(file_path, pages='all', flavor='lattice')
                
                # Create a dictionary to hold the bounding box of tables on each page
                table_locations = {}

                print(f"Found {tables.n} tables. Converting to Markdown and logging locations.")
                for table in tables:
                    # Store table's bounding box to exclude its text later
                    if table.page not in table_locations:
                        table_locations[table.page] = []
                    
                    # The _bbox attribute gives the table coordinates (x1, y1, x2, y2)
                    table_locations[table.page].append(table._bbox)

                    # Convert table to Markdown and add to chunks
                    df = table.df
                    df = df.replace(r'\n', ' ', regex=True)
                    if not df.empty:
                        # Set the first row as the header, ensuring column names are strings
                        df.columns = [str(col) for col in df.iloc[0]]
                        df = df[1:]
                    
                    markdown_table = df.to_markdown(index=False)
                    table_object = {
                        "text_chunk": f"Page {table.page} contains the following table:\n\n{markdown_table}",
                        "source_file": filename
                    }
                    all_data_objects.append(table_object)

                # --- Step 2: Extract non-table text using PyMuPDF, avoiding table areas ---
                doc = fitz.open(file_path)
                for page_num, page in enumerate(doc, 1): # Page numbers in fitz are 0-indexed, camelot is 1-indexed
                    bboxes_on_page = table_locations.get(page_num, [])
                    
                    # For each table on the page, add a redaction to "blank it out"
                    for bbox in bboxes_on_page:
                        page.add_redact_annot(fitz.Rect(bbox), fill=(1, 1, 1)) # Fill with white color
                    
                    # Apply the redactions, which effectively removes the text in those areas
                    page.apply_redactions()
                    
                    # Now, extract the text from the page. The table text is gone.
                    text = page.get_text()
                    
                    # Add the remaining text as a chunk if it's substantial
                    if len(text.strip().split()) > 15: # Heuristic to avoid very small/empty text chunks
                        text_object = {
                            "text_chunk": text,
                            "source_file": filename
                        }
                        all_data_objects.append(text_object)
                doc.close()

            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")
                
    print(f"\n✅ Total data chunks processed from all files: {len(all_data_objects)}")
    return all_data_objects

